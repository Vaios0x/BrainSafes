use stylus_sdk::{
    alloy_primitives::U256,
    prelude::*,
    stylus_proc::stylus_fn,
};

use alloy_primitives::{Address, Bytes};
use core::marker::PhantomData;
use wee_alloc::WeeAlloc;

#[global_allocator]
static ALLOC: WeeAlloc = WeeAlloc::INIT;

#[derive(Debug)]
pub struct OffChainCompute {
    owner: Address,
    processors: StorageMap<Address, ProcessorInfo>,
    compute_requests: StorageMap<U256, ComputeRequest>,
    _phantom: PhantomData<()>,
}

#[derive(Debug, Clone, Storage)]
pub struct ProcessorInfo {
    address: Address,
    compute_power: U256,
    reputation: U256,
    total_processed: U256,
    success_rate: U256,
    is_active: bool,
}

#[derive(Debug, Clone, Storage)]
pub struct ComputeRequest {
    request_id: U256,
    processor: Address,
    input_data: Bytes,
    model_id: U256,
    deadline: U256,
    status: RequestStatus,
    result: Option<ComputeResult>,
}

#[derive(Debug, Clone, Storage)]
pub struct ComputeResult {
    output: Bytes,
    confidence: U256,
    compute_time: U256,
    resources_used: U256,
}

#[derive(Debug, Clone, Storage)]
pub enum RequestStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Disputed,
}

#[stylus_fn]
impl OffChainCompute {
    pub fn new() -> Self {
        Self {
            owner: msg::sender(),
            processors: StorageMap::new(),
            compute_requests: StorageMap::new(),
            _phantom: PhantomData,
        }
    }

    #[stylus_fn(name = "registerProcessor")]
    pub fn register_processor(
        &mut self,
        compute_power: U256,
    ) -> Result<bool, Vec<u8>> {
        let processor = ProcessorInfo {
            address: msg::sender(),
            compute_power,
            reputation: U256::from(100),
            total_processed: U256::ZERO,
            success_rate: U256::from(100),
            is_active: true,
        };

        self.processors.insert(msg::sender(), processor);
        
        emit!(ProcessorRegistered {
            processor: msg::sender(),
            compute_power,
        });

        Ok(true)
    }

    #[stylus_fn(name = "submitComputeRequest")]
    pub fn submit_compute_request(
        &mut self,
        input_data: Bytes,
        model_id: U256,
        deadline: U256,
    ) -> Result<U256, Vec<u8>> {
        require!(deadline > evm::block_timestamp().into(), "Invalid deadline");

        let request_id = self.get_next_request_id();
        let processor = self.select_best_processor()?;

        let request = ComputeRequest {
            request_id,
            processor,
            input_data: input_data.clone(),
            model_id,
            deadline,
            status: RequestStatus::Pending,
            result: None,
        };

        self.compute_requests.insert(request_id, request);

        emit!(ComputeRequestSubmitted {
            request_id,
            processor,
            model_id,
            deadline: deadline.as_u64(),
        });

        Ok(request_id)
    }

    #[stylus_fn(name = "submitComputeResult")]
    pub fn submit_compute_result(
        &mut self,
        request_id: U256,
        output: Bytes,
        confidence: U256,
        compute_time: U256,
        resources_used: U256,
    ) -> Result<bool, Vec<u8>> {
        let mut request = self.compute_requests.get(&request_id)
            .ok_or("Request not found")?;

        require!(request.processor == msg::sender(), "Not assigned processor");
        require!(request.status == RequestStatus::Pending, "Invalid status");
        require!(request.deadline > evm::block_timestamp().into(), "Request expired");

        let result = ComputeResult {
            output,
            confidence,
            compute_time,
            resources_used,
        };

        request.result = Some(result.clone());
        request.status = RequestStatus::Completed;
        self.compute_requests.insert(request_id, request);

        // Update processor stats
        if let Some(mut processor) = self.processors.get(&msg::sender()) {
            processor.total_processed += U256::from(1);
            self.processors.insert(msg::sender(), processor);
        }

        emit!(ComputeResultSubmitted {
            request_id,
            processor: msg::sender(),
            confidence: confidence.as_u64(),
            compute_time: compute_time.as_u64(),
        });

        Ok(true)
    }

    #[stylus_fn(name = "disputeResult")]
    pub fn dispute_result(
        &mut self,
        request_id: U256,
        evidence: Bytes,
    ) -> Result<bool, Vec<u8>> {
        let mut request = self.compute_requests.get(&request_id)
            .ok_or("Request not found")?;

        require!(request.status == RequestStatus::Completed, "Invalid status");
        
        request.status = RequestStatus::Disputed;
        self.compute_requests.insert(request_id, request.clone());

        // Penalize processor if dispute is valid
        if let Some(mut processor) = self.processors.get(&request.processor) {
            processor.reputation = processor.reputation.saturating_sub(U256::from(10));
            if processor.reputation < U256::from(50) {
                processor.is_active = false;
            }
            self.processors.insert(request.processor, processor);
        }

        emit!(ResultDisputed {
            request_id,
            processor: request.processor,
            evidence_hash: evm::keccak256(&evidence),
        });

        Ok(true)
    }

    // Helper functions
    fn select_best_processor(&self) -> Result<Address, Vec<u8>> {
        let mut best_processor = None;
        let mut highest_score = U256::ZERO;

        for (address, info) in self.processors.iter() {
            if !info.is_active {
                continue;
            }

            let score = self.calculate_processor_score(&info);
            if score > highest_score {
                highest_score = score;
                best_processor = Some(address);
            }
        }

        best_processor.ok_or_else(|| "No processors available".into())
    }

    fn calculate_processor_score(&self, processor: &ProcessorInfo) -> U256 {
        // Score based on compute power, reputation and success rate
        let compute_factor = processor.compute_power;
        let reputation_factor = processor.reputation;
        let success_factor = processor.success_rate;

        compute_factor
            .saturating_mul(U256::from(2))
            .saturating_add(reputation_factor)
            .saturating_add(success_factor)
    }

    fn get_next_request_id(&self) -> U256 {
        let block_number = evm::block_number();
        let timestamp = evm::block_timestamp();
        let sender = msg::sender();
        
        let mut data = Vec::with_capacity(32 * 3);
        data.extend_from_slice(&block_number.to_be_bytes());
        data.extend_from_slice(&timestamp.to_be_bytes());
        data.extend_from_slice(sender.as_bytes());
        
        U256::from_be_bytes(evm::keccak256(&data))
    }
}

#[derive(Debug)]
pub struct ProcessorRegistered {
    processor: Address,
    compute_power: U256,
}

#[derive(Debug)]
pub struct ComputeRequestSubmitted {
    request_id: U256,
    processor: Address,
    model_id: U256,
    deadline: u64,
}

#[derive(Debug)]
pub struct ComputeResultSubmitted {
    request_id: U256,
    processor: Address,
    confidence: u64,
    compute_time: u64,
}

#[derive(Debug)]
pub struct ResultDisputed {
    request_id: U256,
    processor: Address,
    evidence_hash: [u8; 32],
}

impl Event for ProcessorRegistered {
    const SIGNATURE: [u8; 32] = keccak256!("ProcessorRegistered(address,uint256)");
}

impl Event for ComputeRequestSubmitted {
    const SIGNATURE: [u8; 32] = keccak256!("ComputeRequestSubmitted(uint256,address,uint256,uint64)");
}

impl Event for ComputeResultSubmitted {
    const SIGNATURE: [u8; 32] = keccak256!("ComputeResultSubmitted(uint256,address,uint64,uint64)");
}

impl Event for ResultDisputed {
    const SIGNATURE: [u8; 32] = keccak256!("ResultDisputed(uint256,address,bytes32)");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_processor() {
        let mut compute = OffChainCompute::new();
        let result = compute.register_processor(U256::from(1000));
        assert!(result.is_ok());
    }

    #[test]
    fn test_submit_request() {
        let mut compute = OffChainCompute::new();
        
        // Register a processor first
        compute.register_processor(U256::from(1000)).unwrap();
        
        let input = vec![1, 2, 3, 4];
        let deadline = evm::block_timestamp() + 3600;
        let result = compute.submit_compute_request(
            input.into(),
            U256::from(1),
            deadline.into(),
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_submit_result() {
        let mut compute = OffChainCompute::new();
        
        // Setup
        compute.register_processor(U256::from(1000)).unwrap();
        let input = vec![1, 2, 3, 4];
        let deadline = evm::block_timestamp() + 3600;
        let request_id = compute.submit_compute_request(
            input.into(),
            U256::from(1),
            deadline.into(),
        ).unwrap();

        // Submit result
        let output = vec![5, 6, 7, 8];
        let result = compute.submit_compute_result(
            request_id,
            output.into(),
            U256::from(95),
            U256::from(100),
            U256::from(1000),
        );
        assert!(result.is_ok());
    }
} 