<?php
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/lib/web3/vendor/autoload.php');
use Web3\Web3;
use Web3\Contract;

/**
 * BrainSafes integration for Moodle
 */
class local_brainsafes extends \core\plugininfo\local {
    private $sdk;
    private $config;
    private $web3;
    private $contract;

    public function __construct() {
        global $CFG;
        
        // Load configuration
        $this->config = get_config('local_brainsafes');
        
        // Initialize Web3
        $this->web3 = new Web3($this->config->rpc_endpoint);
        
        // Load contract ABI
        $contractABI = file_get_contents($CFG->dirroot . '/local/brainsafes/contracts/APIManager.json');
        $this->contract = new Contract($this->web3->provider, $contractABI);
        
        // Set up webhook endpoint
        $this->setupWebhook();
    }

    /**
     * Set up webhook for receiving events
     */
    private function setupWebhook() {
        global $CFG;
        
        try {
            // Generate webhook secret
            $secret = bin2hex(random_bytes(32));
            
            // Register webhook with BrainSafes
            $events = [
                'CourseCompleted',
                'CertificateIssued',
                'AssessmentSubmitted'
            ];
            
            $webhookEndpoint = $CFG->wwwroot . '/local/brainsafes/webhook.php';
            
            $this->contract->send('registerWebhook', [
                'BrainSafes-Moodle',
                $webhookEndpoint,
                $secret,
                $events
            ], function($err, $result) {
                if ($err !== null) {
                    debugging('Failed to register webhook: ' . $err->getMessage());
                    return;
                }
                
                // Save webhook ID and secret
                set_config('webhook_id', $result['webhookId'], 'local_brainsafes');
                set_config('webhook_secret', $secret, 'local_brainsafes');
            });
        } catch (Exception $e) {
            debugging('Webhook setup failed: ' . $e->getMessage());
        }
    }

    /**
     * Handle course completion
     */
    public function course_completed($event) {
        global $DB;
        
        $courseId = $event->courseid;
        $userId = $event->userid;
        
        try {
            // Get course and user data
            $course = $DB->get_record('course', ['id' => $courseId]);
            $user = $DB->get_record('user', ['id' => $userId]);
            
            // Prepare completion data
            $completionData = [
                'courseId' => $courseId,
                'courseName' => $course->fullname,
                'userId' => $userId,
                'userEmail' => $user->email,
                'completionDate' => time(),
                'grade' => $this->get_course_grade($userId, $courseId)
            ];
            
            // Send completion to BrainSafes
            $this->contract->send('recordCompletion', [
                json_encode($completionData)
            ], function($err, $result) use ($userId, $courseId) {
                if ($err !== null) {
                    debugging('Failed to record completion: ' . $err->getMessage());
                    return;
                }
                
                // Store transaction hash
                $record = new stdClass();
                $record->userid = $userId;
                $record->courseid = $courseId;
                $record->txhash = $result['transactionHash'];
                $record->timestamp = time();
                
                $DB->insert_record('local_brainsafes_completions', $record);
            });
        } catch (Exception $e) {
            debugging('Course completion processing failed: ' . $e->getMessage());
        }
    }

    /**
     * Handle certificate issuance
     */
    public function issue_certificate($userId, $courseId) {
        global $DB;
        
        try {
            // Get completion record
            $completion = $DB->get_record('local_brainsafes_completions', [
                'userid' => $userId,
                'courseid' => $courseId
            ]);
            
            if (!$completion) {
                throw new Exception('No completion record found');
            }
            
            // Prepare certificate data
            $certificateData = [
                'userId' => $userId,
                'courseId' => $courseId,
                'completionTxHash' => $completion->txhash,
                'issueDate' => time(),
                'metadata' => $this->get_certificate_metadata($userId, $courseId)
            ];
            
            // Mint certificate NFT
            $this->contract->send('issueCertificate', [
                json_encode($certificateData)
            ], function($err, $result) use ($userId, $courseId) {
                if ($err !== null) {
                    debugging('Failed to issue certificate: ' . $err->getMessage());
                    return;
                }
                
                // Store certificate details
                $record = new stdClass();
                $record->userid = $userId;
                $record->courseid = $courseId;
                $record->txhash = $result['transactionHash'];
                $record->tokenid = $result['events']['CertificateIssued']['returnValues']['tokenId'];
                $record->timestamp = time();
                
                $DB->insert_record('local_brainsafes_certificates', $record);
            });
        } catch (Exception $e) {
            debugging('Certificate issuance failed: ' . $e->getMessage());
        }
    }

    /**
     * Handle assessment submission
     */
    public function assessment_submitted($event) {
        global $DB;
        
        try {
            $submission = $event->get_record_snapshot('assign_submission', $event->objectid);
            
            // Prepare submission data
            $submissionData = [
                'userId' => $submission->userid,
                'assignmentId' => $submission->assignment,
                'submissionId' => $submission->id,
                'submitTime' => $submission->timemodified,
                'content' => $this->get_submission_content($submission)
            ];
            
            // Record submission on chain
            $this->contract->send('recordSubmission', [
                json_encode($submissionData)
            ], function($err, $result) use ($submission) {
                if ($err !== null) {
                    debugging('Failed to record submission: ' . $err->getMessage());
                    return;
                }
                
                // Store submission record
                $record = new stdClass();
                $record->submissionid = $submission->id;
                $record->txhash = $result['transactionHash'];
                $record->timestamp = time();
                
                $DB->insert_record('local_brainsafes_submissions', $record);
            });
        } catch (Exception $e) {
            debugging('Submission processing failed: ' . $e->getMessage());
        }
    }

    /**
     * Helper function to get course grade
     */
    private function get_course_grade($userId, $courseId) {
        $courseItem = grade_item::fetch_course_item($courseId);
        if ($courseItem) {
            $grades = grade_grade::fetch_users_grades($courseItem, [$userId]);
            if ($grades && isset($grades[$userId])) {
                return $grades[$userId]->finalgrade;
            }
        }
        return null;
    }

    /**
     * Helper function to get certificate metadata
     */
    private function get_certificate_metadata($userId, $courseId) {
        global $DB;
        
        $course = $DB->get_record('course', ['id' => $courseId]);
        $user = $DB->get_record('user', ['id' => $userId]);
        
        return [
            'recipientName' => fullname($user),
            'recipientEmail' => $user->email,
            'courseName' => $course->fullname,
            'courseDescription' => $course->summary,
            'issuerName' => get_site()->fullname,
            'completionDate' => time(),
            'grade' => $this->get_course_grade($userId, $courseId),
            'skills' => $this->get_course_skills($courseId)
        ];
    }

    /**
     * Helper function to get submission content
     */
    private function get_submission_content($submission) {
        $context = context_module::instance($submission->assignment);
        $fs = get_file_storage();
        $files = $fs->get_area_files($context->id, 'assignsubmission_file', 'submission_files', $submission->id);
        
        $content = [];
        foreach ($files as $file) {
            if ($file->is_directory()) {
                continue;
            }
            
            $content[] = [
                'filename' => $file->get_filename(),
                'mimetype' => $file->get_mimetype(),
                'size' => $file->get_filesize(),
                'hash' => $file->get_contenthash()
            ];
        }
        
        return $content;
    }

    /**
     * Helper function to get course skills
     */
    private function get_course_skills($courseId) {
        global $DB;
        
        $skills = [];
        $competencies = $DB->get_records_sql(
            "SELECT c.*
             FROM {competency} c
             JOIN {competency_coursecomp} cc ON cc.competencyid = c.id
             WHERE cc.courseid = ?",
            [$courseId]
        );
        
        foreach ($competencies as $competency) {
            $skills[] = [
                'id' => $competency->id,
                'name' => $competency->shortname,
                'description' => $competency->description
            ];
        }
        
        return $skills;
    }
}

/**
 * Plugin file configuration
 */
$plugin->version = 2025010100;
$plugin->requires = 2024042900; // Moodle 4.4
$plugin->component = 'local_brainsafes';
$plugin->maturity = MATURITY_STABLE;
$plugin->release = '1.0.0';
$plugin->dependencies = [
    'local_web3' => 2024010100
]; 