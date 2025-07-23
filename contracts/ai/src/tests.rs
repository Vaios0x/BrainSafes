#[cfg(test)]
mod tests {
    use super::*;
    use alloy_primitives::U256;
    use stylus_sdk::stylus_proc::stylus_fn;

    #[test]
    fn test_model_registration() {
        let mut processor = AIProcessor::new();
        
        let result = processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(32),
            U256::from(100)
        );
        
        assert!(result.is_ok());
        
        let config = processor.get_model_config(U256::from(1)).unwrap();
        assert!(config.is_active);
        assert_eq!(config.input_size, U256::from(1024));
    }

    #[test]
    fn test_inference_processing() {
        let mut processor = AIProcessor::new();
        
        // Registrar modelo
        processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(32),
            U256::from(100)
        ).unwrap();

        // Crear datos de prueba
        let input_data = vec![1, 2, 3, 4];
        let result = processor.process_inference(
            U256::from(1),
            input_data.into()
        );
        
        assert!(result.is_ok());
        let inference = result.unwrap();
        assert!(inference.confidence > U256::ZERO);
    }

    #[test]
    fn test_batch_processing() {
        let mut processor = AIProcessor::new();
        
        // Registrar modelo
        processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(32),
            U256::from(100)
        ).unwrap();

        // Crear datos de prueba
        let inputs = vec![
            vec![1, 2, 3].into(),
            vec![4, 5, 6].into(),
        ];
        
        let result = processor.batch_process(U256::from(1), inputs);
        assert!(result.is_ok());
        
        let results = result.unwrap();
        assert_eq!(results.len(), 2);
        
        for inference in results {
            assert!(inference.confidence > U256::ZERO);
        }
    }

    #[test]
    fn test_stats_tracking() {
        let mut processor = AIProcessor::new();
        
        // Registrar modelo
        processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(32),
            U256::from(100)
        ).unwrap();

        // Realizar inferencias
        let input_data = vec![1, 2, 3, 4];
        processor.process_inference(U256::from(1), input_data.clone().into()).unwrap();
        processor.process_inference(U256::from(1), input_data.into()).unwrap();

        // Verificar estadísticas
        let stats = processor.get_processing_stats(U256::from(1)).unwrap();
        assert_eq!(stats.total_requests, U256::from(2));
        assert!(stats.total_gas_used > U256::ZERO);
        assert!(stats.avg_processing_time > U256::ZERO);
    }

    #[test]
    fn test_error_handling() {
        let processor = AIProcessor::new();
        
        // Intentar procesar sin registrar modelo
        let input_data = vec![1, 2, 3, 4];
        let result = processor.process_inference(U256::from(1), input_data.into());
        assert!(result.is_err());
        
        // Intentar obtener configuración de modelo inexistente
        let result = processor.get_model_config(U256::from(1));
        assert!(result.is_err());
    }

    #[test]
    fn test_input_validation() {
        let mut processor = AIProcessor::new();
        
        // Registrar modelo con tamaño de entrada limitado
        processor.register_model(
            U256::from(1),
            U256::from(4), // inputSize = 4 bytes
            U256::from(128),
            U256::from(32),
            U256::from(100)
        ).unwrap();

        // Intentar procesar input demasiado grande
        let large_input = vec![1; 8]; // 8 bytes
        let result = processor.process_inference(U256::from(1), large_input.into());
        assert!(result.is_err());
    }

    #[test]
    fn test_batch_size_limits() {
        let mut processor = AIProcessor::new();
        
        // Registrar modelo con batch size limitado
        processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(2), // batchSize = 2
            U256::from(100)
        ).unwrap();

        // Intentar procesar batch demasiado grande
        let inputs = vec![
            vec![1, 2, 3].into(),
            vec![4, 5, 6].into(),
            vec![7, 8, 9].into(), // Excede batchSize
        ];
        
        let result = processor.batch_process(U256::from(1), inputs);
        assert!(result.is_err());
    }

    #[test]
    fn test_owner_functions() {
        let mut processor = AIProcessor::new();
        
        // El constructor establece msg.sender como owner
        let result = processor.register_model(
            U256::from(1),
            U256::from(1024),
            U256::from(128),
            U256::from(32),
            U256::from(100)
        );
        
        assert!(result.is_ok());
    }
} 