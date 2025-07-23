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
pub struct AIProcessor {
    owner: Address,
    model_configs: StorageMap<U256, ModelConfig>,
    inference_results: StorageMap<U256, InferenceResult>,
    stats: StorageMap<U256, ProcessingStats>,
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
}

#[derive(Debug, Clone, Storage)]
pub struct InferenceResult {
    request_id: U256,
    input_hash: Bytes,
    output: Bytes,
    confidence: U256,
    timestamp: U256,
    gas_used: U256,
}

#[derive(Debug, Clone, Storage)]
pub struct ProcessingStats {
    total_requests: U256,
    total_gas_used: U256,
    avg_processing_time: U256,
    success_rate: U256,
}

#[stylus_fn]
impl AIProcessor {
    pub fn new() -> Self {
        Self {
            owner: msg::sender(),
            model_configs: StorageMap::new(),
            inference_results: StorageMap::new(),
            stats: StorageMap::new(),
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
    ) -> Result<bool, Vec<u8>> {
        self.ensure_owner()?;
        
        let config = ModelConfig {
            model_id,
            input_size,
            output_size,
            batch_size,
            compute_units,
            is_active: true,
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

        let start_gas = evm::gas_left();
        let start_time = evm::block_timestamp();

        // Procesar inferencia
        let result = self.run_inference(model_id, &input_data)?;
        
        // Calcular estadísticas
        let gas_used = start_gas - evm::gas_left();
        let processing_time = evm::block_timestamp() - start_time;

        // Actualizar estadísticas
        self.update_stats(model_id, gas_used.into(), processing_time.into())?;

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

        for input in inputs {
            let result = self.process_inference(model_id, input)?;
            results.push(result);
        }

        let total_gas = start_gas - evm::gas_left();
        emit!(BatchProcessed {
            model_id,
            count: inputs.len() as u32,
            gas_used: total_gas
        });

        Ok(results)
    }

    #[stylus_fn(name = "getModelConfig")]
    pub fn get_model_config(&self, model_id: U256) -> Result<ModelConfig, Vec<u8>> {
        self.model_configs.get(&model_id)
            .ok_or_else(|| "Model not found".into())
    }

    #[stylus_fn(name = "getProcessingStats")]
    pub fn get_processing_stats(&self, model_id: U256) -> Result<ProcessingStats, Vec<u8>> {
        self.stats.get(&model_id)
            .ok_or_else(|| "Stats not found".into())
    }

    fn run_inference(&mut self, model_id: U256, input: &Bytes) -> Result<InferenceResult, Vec<u8>> {
        let request_id = self.get_next_request_id();
        let input_hash = evm::keccak256(input);

        // Simular procesamiento de IA
        let output = self.simulate_inference(input)?;
        let confidence = self.calculate_confidence(&output);

        let result = InferenceResult {
            request_id,
            input_hash: input_hash.into(),
            output: output.into(),
            confidence,
            timestamp: evm::block_timestamp().into(),
            gas_used: evm::gas_left().into(),
        };

        self.inference_results.insert(request_id, result.clone());
        Ok(result)
    }

    fn simulate_inference(&self, input: &Bytes) -> Result<Vec<u8>, Vec<u8>> {
        // Implementar lógica real de inferencia aquí
        let mut output = Vec::with_capacity(input.len());
        for byte in input.iter() {
            output.push(byte.rotate_left(2));
        }
        Ok(output)
    }

    fn calculate_confidence(&self, output: &[u8]) -> U256 {
        // Implementar cálculo real de confianza aquí
        let sum: u32 = output.iter().map(|&x| x as u32).sum();
        U256::from(sum.saturating_mul(100) / (output.len() as u32 * 255))
    }

    fn update_stats(
        &mut self,
        model_id: U256,
        gas_used: U256,
        processing_time: U256,
    ) -> Result<(), Vec<u8>> {
        let mut stats = self.stats.get(&model_id)
            .unwrap_or_else(|| ProcessingStats {
                total_requests: U256::ZERO,
                total_gas_used: U256::ZERO,
                avg_processing_time: U256::ZERO,
                success_rate: U256::from(100),
            });

        stats.total_requests += U256::from(1);
        stats.total_gas_used += gas_used;
        stats.avg_processing_time = (
            stats.avg_processing_time * (stats.total_requests - U256::from(1)) + processing_time
        ) / stats.total_requests;

        self.stats.insert(model_id, stats);
        Ok(())
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

impl Event for BatchProcessed {
    const SIGNATURE: [u8; 32] = keccak256!("BatchProcessed(uint256,uint32,uint64)");
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
        ).unwrap();

        let input = vec![1, 2, 3, 4];
        let result = processor.process_inference(U256::from(1), input.into());
        assert!(result.is_ok());
    }

    #[test]
    fn test_batch_process() {
        let mut processor = AIProcessor::new();
        processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(32),
            U256::from(100),
        ).unwrap();

        let inputs = vec![
            vec![1, 2, 3].into(),
            vec![4, 5, 6].into(),
        ];
        let result = processor.batch_process(U256::from(1), inputs);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 2);
    }
} 