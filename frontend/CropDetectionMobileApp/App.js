import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  Platform,
  Dimensions,
  useColorScheme,
  View,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  ActivityIndicator,  
} from 'react-native';
import axios from 'axios';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export const { height, width } = Dimensions.get('window');

const App = () => {
  const [plantType, setPlantType] = useState('');
  const [plantConfidence, setPlantConfidence] = useState('');
  const [disease, setDisease] = useState('');
  const [diseaseConfidence, setDiseaseConfidence] = useState('');
  const [image, setImage] = useState('');
  const [cameraPermission, setCameraPermission] = useState(null);
  const [loading, setLoading] = useState(false);  // Loading state
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  const getPrediction = async (params) => {
    setLoading(true);  // Set loading to true when the request starts
    try {
      const formData = new FormData();
      formData.append('file', params);

      const url = 'http://35.40.54.96:8000/predict';
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response?.data) {
        setPlantType(response.data.plant_type);
        setPlantConfidence(response.data.plant_confidence);
        setDisease(response.data.disease);
        setDiseaseConfidence(response.data.disease_confidence);
      } else {
        setPlantType('Error');
        setDisease('Prediction failed');
      }
    } catch (error) {
      setPlantType('Error');
      setDisease('Prediction failed');
      console.error(error);
    } finally {
      setLoading(false);  // Set loading to false when the request is comple
    }
  };

  const openCamera = async () => {
    if (!cameraPermission) {
      alert('Camera permission is required.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      getPrediction({
        uri: result.assets[0].uri,
        name: 'captured.jpg',
        type: 'image/jpg',
      });
    }
  };

  const openLibrary = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      getPrediction({
        uri: result.assets[0].uri,
        name: 'selected.jpg',
        type: 'image/jpg',
      });
    }
  };

  const clearResult = () => {
    setImage('');
    setPlantType('');
    setPlantConfidence('');
    setDisease('');
    setDiseaseConfidence('');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('./assets/farmbackground.jpg')}
        style={styles.backgroundImage}
        blurRadius={4}
        pointerEvents="none" 
      >
        <View style={styles.overlay} />

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Plant Health Monitor</Text>

          <TouchableOpacity onPress={clearResult} style={styles.clearStyle}>
            <Image
              source={require('./assets/delete.png')}
              style={styles.clearImage}
            />
          </TouchableOpacity>

          {loading ? (  // Show loader when loading is true
            <ActivityIndicator size="large" color="#FFD700" />
          ) : image ? (
            <Image source={{ uri: image }} style={styles.imageStyle} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.emptyText}>
                Capture or choose a photo from your gallery below.
              </Text>
            </View>
          )}

          {plantType && disease && !loading && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>
                Plant Type:{' '}
                <Text style={styles.resultValue}>{plantType}</Text>
              </Text>
              <Text style={styles.resultLabel}>
                Confidence:{' '}
                <Text style={styles.resultValue}>
                  {parseFloat(plantConfidence).toFixed(2)}%
                </Text>
              </Text>
              <Text style={styles.resultLabel}>
                Disease: <Text style={styles.resultValue}>{disease}</Text>
              </Text>
              <Text style={styles.resultLabel}>
                Confidence:{' '}
                <Text style={styles.resultValue}>
                  {parseFloat(diseaseConfidence).toFixed(2)}%
                </Text>
              </Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={openCamera} style={styles.btnStyle}>
              <Image
                source={require('./assets/camera.png')}
                style={styles.imageIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={openLibrary} style={styles.btnStyle}>
              <Image
                source={require('./assets/gallery.png')}
                style={styles.imageIcon}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(101, 67, 33, 0.55)', 
    zIndex: 0,
  },
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 30,
    color: '#FFF',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  clearStyle: {
    marginTop: 20, 
  },
  clearImage: {
    height: 30,
    width: 30,
    tintColor: '#FFF',
  },
  imageStyle: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    marginVertical: 40, 
  },
  placeholderContainer: {
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 40, 
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 12,
    marginVertical: 20,
    width: width * 0.9,
  },
  resultLabel: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  resultValue: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 40, 
  },
  btnStyle: {
    backgroundColor: '#FFF',
    opacity: 0.85,
    padding: 15,
    borderRadius: 20,
  },
  imageIcon: {
    height: 35,
    width: 35,
    tintColor: '#000',
  },
});

export default App;
