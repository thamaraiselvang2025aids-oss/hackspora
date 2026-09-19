import os
from ultralytics import YOLO

def main():
    # 1. Load the pre-trained model to start from a good baseline
    print("Loading pre-trained yolo11s.pt model...")
    model = YOLO("yolo11s.pt") 
    
    # Path to your dataset's data.yaml file
    # This file tells YOLO where your images are and what the classes are.
    # For small items (pen, specs, watch, keys), ensure your dataset is mapped here.
    data_yaml_path = os.path.abspath("datasets/small_items_dataset/data.yaml")
    
    if not os.path.exists(data_yaml_path):
        print(f"ERROR: Could not find {data_yaml_path}")
        print("Please ensure your dataset is placed in backend/datasets/small_items_dataset/")
        return

    # 2. Train the model
    print(f"Starting training using dataset: {data_yaml_path}")
    print("This may take a while depending on your hardware...")
    
    # We use 50 epochs as a good starting point for fine-tuning.
    results = model.train(
        data=data_yaml_path,
        epochs=50,
        imgsz=640,
        batch=16,
        name="small_items_model" # Results will be saved to runs/detect/small_items_model/
    )
    
    print("\nTraining Complete!")
    print("Your new model weights are saved at:")
    print("runs/detect/small_items_model/weights/best.pt")
    print("\nUpdate your .env file with YOLO_MODEL=runs/detect/small_items_model/weights/best.pt to use it!")

if __name__ == '__main__':
    main()
