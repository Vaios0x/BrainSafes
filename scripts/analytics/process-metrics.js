const { ethers } = require("hardhat");
const { createObjectCsvWriter } = require("csv-writer");
const fs = require("fs");
const path = require("path");
const Chart = require("chart.js");

async function main() {
    console.log("Processing BrainSafes Analytics Data...");

    // Connect to contracts
    const AnalyticsManager = await ethers.getContractFactory("AnalyticsManager");
    const analytics = await AnalyticsManager.attach("ANALYTICS_CONTRACT_ADDRESS");

    // Time windows
    const DAILY = await analytics.DAILY_WINDOW();
    const WEEKLY = await analytics.WEEKLY_WINDOW();
    const MONTHLY = await analytics.MONTHLY_WINDOW();

    // Fetch reports
    const reports = await Promise.all([
        fetchReport(analytics, "USAGE", DAILY),
        fetchReport(analytics, "PERFORMANCE", DAILY),
        fetchReport(analytics, "GOVERNANCE", DAILY),
        fetchReport(analytics, "ADMIN", DAILY)
    ]);

    // Process and save metrics
    await processMetrics(reports);

    // Generate visualizations
    await generateCharts(reports);

    console.log("Analytics processing completed!");
}

async function fetchReport(analytics, reportType, timeWindow) {
    const reportHash = await analytics.generateReport(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(reportType)),
        timeWindow
    );

    // Get raw data from events
    const filter = analytics.filters.MetricsUpdated(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(reportType))
    );
    const events = await analytics.queryFilter(filter);

    return {
        type: reportType,
        hash: reportHash,
        events: events
    };
}

async function processMetrics(reports) {
    // Create output directory
    const outputDir = path.join(__dirname, "../../analytics/data");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Process each report type
    for (const report of reports) {
        const csvWriter = createObjectCsvWriter({
            path: path.join(outputDir, `${report.type.toLowerCase()}_metrics.csv`),
            header: getHeadersForType(report.type)
        });

        const records = processEventsToRecords(report.events);
        await csvWriter.writeRecords(records);
    }
}

async function generateCharts(reports) {
    const outputDir = path.join(__dirname, "../../analytics/charts");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const report of reports) {
        const chartConfig = getChartConfigForType(report.type, report.events);
        const chart = new Chart(chartConfig);
        
        // Save chart as image
        const buffer = await chart.toBuffer("image/png");
        fs.writeFileSync(
            path.join(outputDir, `${report.type.toLowerCase()}_chart.png`),
            buffer
        );
    }
}

function getHeadersForType(reportType) {
    switch (reportType) {
        case "USAGE":
            return [
                { id: "timestamp", title: "Timestamp" },
                { id: "totalUsers", title: "Total Users" },
                { id: "activeUsers", title: "Active Users" },
                { id: "coursesCreated", title: "Courses Created" },
                { id: "coursesCompleted", title: "Courses Completed" },
                { id: "certificatesIssued", title: "Certificates Issued" }
            ];
        case "PERFORMANCE":
            return [
                { id: "timestamp", title: "Timestamp" },
                { id: "avgGasUsed", title: "Average Gas Used" },
                { id: "peakGasUsed", title: "Peak Gas Used" },
                { id: "successRate", title: "Success Rate" },
                { id: "failureRate", title: "Failure Rate" }
            ];
        case "GOVERNANCE":
            return [
                { id: "timestamp", title: "Timestamp" },
                { id: "totalProposals", title: "Total Proposals" },
                { id: "acceptedProposals", title: "Accepted Proposals" },
                { id: "rejectedProposals", title: "Rejected Proposals" },
                { id: "avgParticipation", title: "Average Participation %" }
            ];
        case "ADMIN":
            return [
                { id: "timestamp", title: "Timestamp" },
                { id: "revenue", title: "Total Revenue" },
                { id: "scholarships", title: "Active Scholarships" },
                { id: "platformHealth", title: "Platform Health" },
                { id: "systemUptime", title: "System Uptime (hours)" }
            ];
        default:
            return [];
    }
}

function getChartConfigForType(reportType, events) {
    const data = processEventsToChartData(events);
    
    return {
        type: "line",
        data: {
            labels: data.labels,
            datasets: getDatasetsByType(reportType, data)
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${reportType} Metrics Over Time`
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };
}

function getDatasetsByType(reportType, data) {
    switch (reportType) {
        case "USAGE":
            return [
                {
                    label: "Total Users",
                    data: data.totalUsers,
                    borderColor: "rgb(75, 192, 192)"
                },
                {
                    label: "Active Users",
                    data: data.activeUsers,
                    borderColor: "rgb(255, 99, 132)"
                }
            ];
        case "PERFORMANCE":
            return [
                {
                    label: "Success Rate",
                    data: data.successRate,
                    borderColor: "rgb(54, 162, 235)"
                },
                {
                    label: "Gas Efficiency",
                    data: data.gasEfficiency,
                    borderColor: "rgb(255, 206, 86)"
                }
            ];
        case "GOVERNANCE":
            return [
                {
                    label: "Proposal Success Rate",
                    data: data.proposalSuccess,
                    borderColor: "rgb(153, 102, 255)"
                },
                {
                    label: "Participation Rate",
                    data: data.participation,
                    borderColor: "rgb(255, 159, 64)"
                }
            ];
        case "ADMIN":
            return [
                {
                    label: "Platform Health",
                    data: data.platformHealth,
                    borderColor: "rgb(75, 192, 192)"
                },
                {
                    label: "Revenue Growth",
                    data: data.revenueGrowth,
                    borderColor: "rgb(255, 99, 132)"
                }
            ];
        default:
            return [];
    }
}

function processEventsToRecords(events) {
    return events.map(event => {
        const timestamp = new Date(event.args.timestamp.toNumber() * 1000);
        const values = event.args.values || [];
        
        return {
            timestamp: timestamp.toISOString(),
            ...values
        };
    });
}

function processEventsToChartData(events) {
    const labels = [];
    const datasets = {};

    events.forEach(event => {
        const timestamp = new Date(event.args.timestamp.toNumber() * 1000);
        labels.push(timestamp.toLocaleDateString());

        Object.entries(event.args.values || {}).forEach(([key, value]) => {
            if (!datasets[key]) {
                datasets[key] = [];
            }
            datasets[key].push(value.toNumber());
        });
    });

    return {
        labels,
        ...datasets
    };
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    }); 