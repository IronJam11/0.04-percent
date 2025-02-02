from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# def your_dl_model(lat, lon, area):
#     processed_data = {
#         'latitude': lat,
#         'longitude': lon,
#         'area': area,
#         'result': f"Processed result for area {area} at ({lat}, {lon})"
#     }
#     return processed_data

import ultralytics
import IPython.display as display
from ultralytics import YOLO
import subprocess
from skimage import io

model = YOLO("./weights/best.pt")  
sample_img1= "./assets/sample_1.jpg"
sample_img2= "./assets/sample_2.jpg"
def model_pass_through(lat,lon,area,year):
    # command1 = "!yolo task=detect mode=predict model=/Users/abhivansh/Desktop/0.04-percent/backend/weights/best.pt source=/Users/abhivansh/Desktop/0.04-percent/tree_detection/Dataset/valid/images/cl_261910_4_174455_4_19_jpg.rf.bee3769739f7df98507f42e023b155e8.jpg conf=0.1"
    # subprocess.run(command1, shell=True)
    # command2 = "!yolo task=detect mode=predict model=/Users/abhivansh/Desktop/0.04-percent/backend/weights/best.pt source=/Users/abhivansh/Desktop/0.04-percent/tree_detection/Dataset/valid/images/cr_261969_4_174264_4_19_jpg.rf.de93c98ffc682d16dd91d862ff1d636c.jpg conf=0.1"
    # subprocess.run(command2, shell=True)
    PATH1 = "./assets/sample_1.jpg"
    PATH2 = "./assets/sample_2.jpg"
    pred_img1 = io.imread(PATH1)
    pred_img2 = io.imread(PATH2)
    plots1 = model.predict((pred_img1),conf=0.1)
    plots2 = model.predict((pred_img2),conf=0.1)
    trees1 = len(plots1[0].boxes.xyxy)
    #assuming area of each tree .3m^2
    area1 = trees1*(9.3)
    trees2 = len(plots2[0].boxes.xyxy)
    area2 = trees2*(9.3)
    percentage_change = ((trees2-trees1)/trees1)*100
    avg_ndvi = 0.6
    cc = area*(4.0486)*(1 + percentage_change/200)*(2025-year)*(1 + avg_ndvi)/100
    return cc

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        if not data or 'latitude' not in data or 'longitude' not in data or 'area' not in data:
            return jsonify({'error': 'Missing required parameters'}), 400

        lat = float(data['latitude'])
        lon = float(data['longitude'])
        area = float(data['area'])
        year = int(data['year'])

        result = model_pass_through(lat, lon, area,year)

        return jsonify({
            'status': 'success',
            'prediction': result
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)