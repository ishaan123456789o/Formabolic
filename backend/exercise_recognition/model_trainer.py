import numpy as np
import pickle
from pathlib import Path
from typing import Dict, Any, Tuple
import json
from datetime import datetime

# Import ML libraries (these will be installed later)
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
    from sklearn.model_selection import GridSearchCV
    import joblib
except ImportError:
    print("Warning: scikit-learn not installed. Install with: pip install scikit-learn")
    RandomForestClassifier = None
    joblib = None

try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
    from tensorflow.keras.optimizers import Adam
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
except ImportError:
    print("Warning: TensorFlow not installed. Install with: pip install tensorflow")
    tf = None

class ExerciseModelTrainer:
    def __init__(self, data_dir: str = "extracted_data"):
        self.data_dir = Path(data_dir)
        self.models = {}
        
    def load_preprocessed_data(self, filename: str = "preprocessed_data.pkl") -> Dict[str, Any]:
        """Load preprocessed training data."""
        data_path = self.data_dir / filename
        if not data_path.exists():
            raise FileNotFoundError(f"Preprocessed data not found: {data_path}")
        
        with open(data_path, 'rb') as f:
            data = pickle.load(f)
        
        return data
    
    def train_random_forest(self, data: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Train a Random Forest classifier on the exercise data.
        
        Args:
            data: Preprocessed training data
            **kwargs: Additional parameters for RandomForestClassifier
        
        Returns:
            Dictionary containing model and training results
        """
        if RandomForestClassifier is None:
            raise ImportError("scikit-learn is required for Random Forest training")
        
        print("Training Random Forest classifier...")
        
        # Reshape data for Random Forest (flatten sequences)
        X_train_flat = data['X_train'].reshape(data['X_train'].shape[0], -1)
        X_test_flat = data['X_test'].reshape(data['X_test'].shape[0], -1)
        
        # Initialize model
        rf_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'random_state': 42,
            'n_jobs': -1,
            **kwargs
        }
        
        model = RandomForestClassifier(**rf_params)
        
        # Train model
        model.fit(X_train_flat, data['y_train'])
        
        # Make predictions
        y_pred = model.predict(X_test_flat)
        y_pred_proba = model.predict_proba(X_test_flat)
        
        # Calculate metrics
        accuracy = accuracy_score(data['y_test'], y_pred)
        report = classification_report(data['y_test'], y_pred, 
                                     target_names=data['class_names'], 
                                     output_dict=True)
        
        results = {
            'model': model,
            'accuracy': accuracy,
            'classification_report': report,
            'predictions': y_pred,
            'probabilities': y_pred_proba,
            'feature_importance': model.feature_importances_,
            'model_type': 'random_forest'
        }
        
        print(f"Random Forest Accuracy: {accuracy:.4f}")
        print(f"Training completed for {len(data['class_names'])} classes")
        
        return results
    
    def train_lstm(self, data: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """
        Train an LSTM model on the exercise data.
        
        Args:
            data: Preprocessed training data
            **kwargs: Additional parameters for LSTM training
        
        Returns:
            Dictionary containing model and training results
        """
        if tf is None:
            raise ImportError("TensorFlow is required for LSTM training")
        
        print("Training LSTM model...")
        
        # Get model parameters
        lstm_params = {
            'units': 64,
            'dropout': 0.3,
            'learning_rate': 0.001,
            'epochs': 50,
            'batch_size': 32,
            **kwargs
        }
        
        # Build LSTM model
        model = Sequential([
            LSTM(lstm_params['units'], return_sequences=True, 
                 input_shape=(data['sequence_length'], data['feature_dim'])),
            Dropout(lstm_params['dropout']),
            LSTM(lstm_params['units'] // 2),
            Dropout(lstm_params['dropout']),
            Dense(len(data['class_names']), activation='softmax')
        ])
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=lstm_params['learning_rate']),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Callbacks
        callbacks = [
            EarlyStopping(patience=10, restore_best_weights=True),
            ModelCheckpoint(
                filepath=str(self.data_dir / "best_lstm_model.h5"),
                save_best_only=True,
                monitor='val_accuracy'
            )
        ]
        
        # Train model
        history = model.fit(
            data['X_train'], data['y_train'],
            validation_data=(data['X_test'], data['y_test']),
            epochs=lstm_params['epochs'],
            batch_size=lstm_params['batch_size'],
            callbacks=callbacks,
            verbose=1
        )
        
        # Evaluate model
        test_loss, test_accuracy = model.evaluate(data['X_test'], data['y_test'], verbose=0)
        y_pred = model.predict(data['X_test'])
        y_pred_classes = np.argmax(y_pred, axis=1)
        
        # Calculate metrics
        report = classification_report(data['y_test'], y_pred_classes,
                                     target_names=data['class_names'],
                                     output_dict=True)
        
        results = {
            'model': model,
            'accuracy': test_accuracy,
            'loss': test_loss,
            'classification_report': report,
            'predictions': y_pred_classes,
            'probabilities': y_pred,
            'history': history.history,
            'model_type': 'lstm'
        }
        
        print(f"LSTM Accuracy: {test_accuracy:.4f}")
        print(f"Training completed for {len(data['class_names'])} classes")
        
        return results
    
    def save_model(self, model_results: Dict[str, Any], model_name: str = None):
        """Save trained model and results."""
        if model_name is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            model_name = f"{model_results['model_type']}_{timestamp}"
        
        model_dir = self.data_dir / "trained_models" / model_name
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model
        if model_results['model_type'] == 'random_forest':
            model_path = model_dir / "model.pkl"
            joblib.dump(model_results['model'], model_path)
        elif model_results['model_type'] == 'lstm':
            model_path = model_dir / "model.h5"
            model_results['model'].save(model_path)
        
        # Save results
        results_path = model_dir / "training_results.json"
        
        # Convert numpy arrays to lists for JSON serialization
        results_for_json = {}
        for key, value in model_results.items():
            if key == 'model':
                continue  # Skip the model object
            elif isinstance(value, np.ndarray):
                results_for_json[key] = value.tolist()
            elif isinstance(value, dict):
                # Handle nested dictionaries (like classification_report)
                results_for_json[key] = value
            else:
                results_for_json[key] = value
        
        with open(results_path, 'w') as f:
            json.dump(results_for_json, f, indent=2)
        
        print(f"Model saved to: {model_dir}")
        return model_dir
    
    def load_model(self, model_dir: str) -> Dict[str, Any]:
        """Load a trained model and its results."""
        model_path = Path(model_dir)
        
        # Load results
        results_path = model_path / "training_results.json"
        with open(results_path, 'r') as f:
            results = json.load(f)
        
        # Load model
        if results['model_type'] == 'random_forest':
            model_file = model_path / "model.pkl"
            results['model'] = joblib.load(model_file)
        elif results['model_type'] == 'lstm':
            model_file = model_path / "model.h5"
            results['model'] = tf.keras.models.load_model(model_file)
        
        return results
    
    def compare_models(self, model_results_list: list) -> Dict[str, Any]:
        """Compare multiple trained models."""
        comparison = {
            'models': [],
            'best_model': None,
            'best_accuracy': 0
        }
        
        for results in model_results_list:
            model_info = {
                'type': results['model_type'],
                'accuracy': results['accuracy'],
                'classification_report': results['classification_report']
            }
            
            if results['model_type'] == 'lstm':
                model_info['loss'] = results['loss']
            
            comparison['models'].append(model_info)
            
            if results['accuracy'] > comparison['best_accuracy']:
                comparison['best_accuracy'] = results['accuracy']
                comparison['best_model'] = results['model_type']
        
        return comparison

def main():
    """Example usage of the model trainer."""
    trainer = ExerciseModelTrainer()
    
    try:
        # Load preprocessed data
        print("Loading preprocessed data...")
        data = trainer.load_preprocessed_data()
        
        # Train Random Forest
        print("\n" + "="*50)
        rf_results = trainer.train_random_forest(data)
        trainer.save_model(rf_results, "random_forest_v1")
        
        # Train LSTM (if TensorFlow is available)
        if tf is not None:
            print("\n" + "="*50)
            lstm_results = trainer.train_lstm(data, epochs=20)  # Reduced epochs for demo
            trainer.save_model(lstm_results, "lstm_v1")
            
            # Compare models
            comparison = trainer.compare_models([rf_results, lstm_results])
            print(f"\nBest model: {comparison['best_model']} (Accuracy: {comparison['best_accuracy']:.4f})")
        else:
            print("\nSkipping LSTM training (TensorFlow not available)")
        
        print("\nTraining complete!")
        
    except Exception as e:
        print(f"Error during training: {e}")

if __name__ == "__main__":
    main() 