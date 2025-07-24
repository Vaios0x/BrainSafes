use stylus_sdk::{
    alloy_primitives::U256,
    prelude::*,
    stylus_proc::stylus_fn,
};

use alloy_primitives::{Address, Bytes, FixedBytes};
use core::marker::PhantomData;
use wee_alloc::WeeAlloc;

#[global_allocator]
static ALLOC: WeeAlloc = WeeAlloc::INIT;

// Optimized data structures for Stylus
#[derive(Debug)]
pub struct AIProcessor {
    owner: Address,
    model_configs: StorageMap<U256, ModelConfig>,
    inference_results: StorageMap<U256, InferenceResult>,
    stats: StorageMap<U256, ProcessingStats>,
    computation_cache: StorageMap<FixedBytes<32>, CacheEntry>,
    off_chain_requests: StorageMap<U256, OffChainRequest>,
    _phantom: PhantomData<()>,
}

#[derive(Debug, Clone, Storage)]
pub struct ModelConfig {
    model_id: U256,
    input_size: U256,
    output_size: U256,
    batch_size: U256,
    compute_units: U256,
    is_active: bool,
    off_chain_enabled: bool,
    cache_ttl: U256,
    max_gas_limit: U256,
}

#[derive(Debug, Clone, Storage)]
pub struct InferenceResult {
    request_id: U256,
    input_hash: Bytes,
    output: Bytes,
    confidence: U256,
    timestamp: U256,
    gas_used: U256,
    computation_source: ComputationSource,
}

#[derive(Debug, Clone, Storage)]
pub struct CacheEntry {
    result: Bytes,
    timestamp: U256,
    ttl: U256,
    hits: U256,
}

#[derive(Debug, Clone, Storage)]
pub struct OffChainRequest {
    request_id: U256,
    model_id: U256,
    input_data: Bytes,
    callback_address: Address,
    callback_data: Bytes,
    deadline: U256,
    status: RequestStatus,
}

#[derive(Debug, Clone, Storage)]
pub enum ComputationSource {
    OnChain,
    OffChain,
    Cached,
}

#[derive(Debug, Clone, Storage)]
pub enum RequestStatus {
    Pending,
    Completed,
    Failed,
    TimedOut,
}

#[derive(Debug, Clone, Storage)]
pub struct ProcessingStats {
    total_requests: U256,
    total_gas_used: U256,
    avg_processing_time: U256,
    success_rate: U256,
    cache_hit_rate: U256,
    off_chain_ratio: U256,
}

#[stylus_fn]
impl AIProcessor {
    pub fn new() -> Self {
        Self {
            owner: msg::sender(),
            model_configs: StorageMap::new(),
            inference_results: StorageMap::new(),
            stats: StorageMap::new(),
            computation_cache: StorageMap::new(),
            off_chain_requests: StorageMap::new(),
            _phantom: PhantomData,
        }
    }

    #[stylus_fn(name = "registerModel")]
    pub fn register_model(
        &mut self,
        model_id: U256,
        input_size: U256,
        output_size: U256,
        batch_size: U256,
        compute_units: U256,
        off_chain_enabled: bool,
        cache_ttl: U256,
        max_gas_limit: U256,
    ) -> Result<bool, Vec<u8>> {
        self.ensure_owner()?;
        
        let config = ModelConfig {
            model_id,
            input_size,
            output_size,
            batch_size,
            compute_units,
            is_active: true,
            off_chain_enabled,
            cache_ttl,
            max_gas_limit,
        };
        
        self.model_configs.insert(model_id, config);
        Ok(true)
    }

    #[stylus_fn(name = "processInference")]
    pub fn process_inference(
        &mut self,
        model_id: U256,
        input_data: Bytes,
    ) -> Result<InferenceResult, Vec<u8>> {
        let config = self.model_configs.get(&model_id)
            .ok_or("Model not found")?;
        
        require!(config.is_active, "Model not active");
        require!(input_data.len() <= config.input_size.as_usize(), "Input too large");

        // Check cache first
        let input_hash = evm::keccak256(&input_data);
        if let Some(cached) = self.check_cache(&input_hash.into())? {
            return Ok(self.create_result_from_cache(cached, input_hash.into()));
        }

        // Check if should process off-chain
        if self.should_process_off_chain(&config, &input_data)? {
            return self.submit_off_chain_request(model_id, input_data);
        }

        // Process on-chain
        let start_gas = evm::gas_left();
        let start_time = evm::block_timestamp();

        let result = self.run_inference(model_id, &input_data)?;
        
        // Update stats and cache
        let gas_used = start_gas - evm::gas_left();
        let processing_time = evm::block_timestamp() - start_time;
        self.update_stats(model_id, gas_used.into(), processing_time.into())?;
        self.cache_result(input_hash.into(), &result, config.cache_ttl)?;

        Ok(result)
    }

    #[stylus_fn(name = "batchProcess")]
    pub fn batch_process(
        &mut self,
        model_id: U256,
        inputs: Vec<Bytes>,
    ) -> Result<Vec<InferenceResult>, Vec<u8>> {
        let config = self.model_configs.get(&model_id)
            .ok_or("Model not found")?;
        
        require!(inputs.len() <= config.batch_size.as_usize(), "Batch too large");

        let mut results = Vec::with_capacity(inputs.len());
        let start_gas = evm::gas_left();

        // Parallel processing simulation
        let chunks = inputs.chunks(4);
        for chunk in chunks {
            let mut chunk_results = Vec::with_capacity(chunk.len());
            for input in chunk {
                let result = self.process_inference(model_id, input.clone())?;
                chunk_results.push(result);
            }
            results.extend(chunk_results);
        }

        let total_gas = start_gas - evm::gas_left();
        emit!(BatchProcessed {
            model_id,
            count: inputs.len() as u32,
            gas_used: total_gas
        });

        Ok(results)
    }

    #[stylus_fn(name = "submitOffChainResult")]
    pub fn submit_off_chain_result(
        &mut self,
        request_id: U256,
        result: Bytes,
        confidence: U256,
    ) -> Result<bool, Vec<u8>> {
        let request = self.off_chain_requests.get(&request_id)
            .ok_or("Request not found")?;
        
        require!(request.status == RequestStatus::Pending, "Invalid request status");
        
        let inference_result = InferenceResult {
            request_id,
            input_hash: evm::keccak256(&request.input_data).into(),
            output: result.clone(),
            confidence,
            timestamp: evm::block_timestamp().into(),
            gas_used: U256::ZERO,
            computation_source: ComputationSource::OffChain,
        };

        self.inference_results.insert(request_id, inference_result);
        
        // Update request status
        let mut updated_request = request;
        updated_request.status = RequestStatus::Completed;
        self.off_chain_requests.insert(request_id, updated_request);

        // Cache the result
        let config = self.model_configs.get(&request.model_id)
            .ok_or("Model not found")?;
        self.cache_result(
            evm::keccak256(&request.input_data).into(),
            &inference_result,
            config.cache_ttl,
        )?;

        Ok(true)
    }

    // Helper functions
    fn check_cache(&self, input_hash: &FixedBytes<32>) -> Result<Option<CacheEntry>, Vec<u8>> {
        if let Some(entry) = self.computation_cache.get(input_hash) {
            if entry.timestamp + entry.ttl > evm::block_timestamp().into() {
                return Ok(Some(entry));
            }
        }
        Ok(None)
    }

    fn cache_result(
        &mut self,
        input_hash: FixedBytes<32>,
        result: &InferenceResult,
        ttl: U256,
    ) -> Result<(), Vec<u8>> {
        let entry = CacheEntry {
            result: result.output.clone(),
            timestamp: evm::block_timestamp().into(),
            ttl,
            hits: U256::from(1),
        };
        self.computation_cache.insert(input_hash, entry);
        Ok(())
    }

    fn should_process_off_chain(
        &self,
        config: &ModelConfig,
        input_data: &Bytes,
    ) -> Result<bool, Vec<u8>> {
        if !config.off_chain_enabled {
            return Ok(false);
        }

        // Estimate gas cost
        let estimated_gas = self.estimate_computation_gas(input_data)?;
        Ok(estimated_gas > config.max_gas_limit)
    }

    fn submit_off_chain_request(
        &mut self,
        model_id: U256,
        input_data: Bytes,
    ) -> Result<InferenceResult, Vec<u8>> {
        let request_id = self.get_next_request_id();
        let deadline = evm::block_timestamp() + 3600; // 1 hour deadline

        let request = OffChainRequest {
            request_id,
            model_id,
            input_data: input_data.clone(),
            callback_address: msg::sender(),
            callback_data: Bytes::new(),
            deadline: deadline.into(),
            status: RequestStatus::Pending,
        };

        self.off_chain_requests.insert(request_id, request);

        emit!(OffChainRequestSubmitted {
            request_id,
            model_id,
            deadline: deadline as u64,
        });

        // Return a pending result
        Ok(InferenceResult {
            request_id,
            input_hash: evm::keccak256(&input_data).into(),
            output: Bytes::new(),
            confidence: U256::ZERO,
            timestamp: evm::block_timestamp().into(),
            gas_used: U256::ZERO,
            computation_source: ComputationSource::OffChain,
        })
    }

    fn estimate_computation_gas(&self, input_data: &Bytes) -> Result<U256, Vec<u8>> {
        // Implement gas estimation logic
        Ok(U256::from(input_data.len() * 100_000))
    }

    fn create_result_from_cache(
        &self,
        cache: CacheEntry,
        input_hash: FixedBytes<32>,
    ) -> InferenceResult {
        InferenceResult {
            request_id: U256::ZERO,
            input_hash: input_hash.to_vec().into(),
            output: cache.result,
            confidence: U256::from(100),
            timestamp: evm::block_timestamp().into(),
            gas_used: U256::ZERO,
            computation_source: ComputationSource::Cached,
        }
    }

    fn get_next_request_id(&self) -> U256 {
        // Implementar generación segura de IDs
        let block_number = evm::block_number();
        let timestamp = evm::block_timestamp();
        let sender = msg::sender();
        
        let mut data = Vec::with_capacity(32 * 3);
        data.extend_from_slice(&block_number.to_be_bytes());
        data.extend_from_slice(&timestamp.to_be_bytes());
        data.extend_from_slice(sender.as_bytes());
        
        U256::from_be_bytes(evm::keccak256(&data))
    }

    fn ensure_owner(&self) -> Result<(), Vec<u8>> {
        require!(msg::sender() == self.owner, "Not owner");
        Ok(())
    }
}

#[derive(Debug)]
pub struct BatchProcessed {
    model_id: U256,
    count: u32,
    gas_used: u64,
}

#[derive(Debug)]
pub struct OffChainRequestSubmitted {
    request_id: U256,
    model_id: U256,
    deadline: u64,
}

impl Event for BatchProcessed {
    const SIGNATURE: [u8; 32] = keccak256!("BatchProcessed(uint256,uint32,uint64)");
}

impl Event for OffChainRequestSubmitted {
    const SIGNATURE: [u8; 32] = keccak256!("OffChainRequestSubmitted(uint256,uint256,uint64)");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_model() {
        let mut processor = AIProcessor::new();
        let result = processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(32),
            U256::from(100),
            true,
            U256::from(3600),
            U256::from(1_000_000),
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_process_inference() {
        let mut processor = AIProcessor::new();
        processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(32),
            U256::from(100),
            true,
            U256::from(3600),
            U256::from(1_000_000),
        ).unwrap();

        let input = vec![1, 2, 3, 4];
        let result = processor.process_inference(U256::from(1), input.into());
        assert!(result.is_ok());
    }

    #[test]
    fn test_cache_hit() {
        let mut processor = AIProcessor::new();
        processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(32),
            U256::from(100),
            true,
            U256::from(3600),
            U256::from(1_000_000),
        ).unwrap();

        let input = vec![1, 2, 3, 4];
        
        // First call should process
        let result1 = processor.process_inference(U256::from(1), input.clone().into());
        assert!(result1.is_ok());
        
        // Second call should hit cache
        let result2 = processor.process_inference(U256::from(1), input.into());
        assert!(result2.is_ok());
        assert_eq!(
            result2.unwrap().computation_source,
            ComputationSource::Cached
        );
    }
} 