# Wine Rating App Development Guide

## Project Overview

**App Name**: WineRate (or choose your own)

**Description**: A cross-platform mobile application that allows wine enthusiasts to rate, catalog, and share their wine experiences with friends. Users can capture photos of wine bottles, rate wines across multiple dimensions, maintain a personal collection, and share recommendations.

**Target Platforms**: iOS and Android

**Development Approach**: Cross-platform using React Native

## Key Features

1. **User Authentication & Profiles**
   - Account creation and login functionality
   - Personal profile with preferences and statistics
   - Friend connections and following mechanism

2. **Wine Catalog & Search**
   - Searchable wine database
   - Barcode/label scanning for quick identification
   - Manual wine entry with customizable fields

3. **Rating System**
   - Multi-dimensional rating (Taste, Mouthfeel, Dryness, Value, etc.)
   - Customizable rating criteria
   - Overall average scoring
   - Rating history and trends

4. **Media Capture**
   - Photo capture of bottles/labels
   - Photo storage optimization
   - Optional notes and location tagging

5. **Social & Sharing Features**
   - Activity feed of friends' ratings
   - Direct sharing to friends within the app
   - Optional social media integration
   - Collaborative lists and recommendations

6. **Personal Collection**
   - Cellar inventory management
   - Wishlist functionality
   - Favorite wines and collections

## Technical Implementation

### Development Framework

**React Native** is the recommended framework for this project because:
- Cross-platform (iOS and Android) with a single codebase
- JavaScript-based, which has a large developer community
- Excellent UI component libraries
- Native performance for critical features
- Good camera and storage integration
- Cost-effective for development and maintenance

### Project Setup

1. **Environment Setup**:
   ```bash
   # Install Node.js and npm
   # Install React Native CLI
   npm install -g react-native-cli
   
   # Create a new React Native project
   npx react-native init VinRateApp
   
   # Navigate to project directory
   cd VinRateApp
   ```

2. **Key Dependencies**:
   ```json
   {
     "dependencies": {
       "react": "^18.2.0",
       "react-native": "^0.72.0",
       "react-navigation": "^4.4.4",
       "firebase": "^9.22.0",
       "react-native-camera": "^4.2.1",
       "react-native-image-picker": "^5.4.0",
       "react-native-vector-icons": "^9.2.0",
       "react-native-elements": "^3.4.3",
       "react-native-async-storage": "^1.18.1"
     }
   }
   ```

### Backend & Database

For a cost-effective solution, use **Firebase** for backend services:

1. **Firebase Setup**:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Add iOS and Android apps to your Firebase project
   - Download and add configuration files to your React Native project
   - Enable Authentication, Firestore, and Storage services

2. **Database Structure** (Firestore):
   ```
   /users/{userId}
     - displayName
     - email
     - profilePicture
     - preferences
     - friends: [userId1, userId2, ...]
   
   /wines/{wineId}
     - name
     - vineyard
     - vintage
     - varietal
     - region
     - country
     - averageRating
     - ratingCount
   
   /ratings/{ratingId}
     - userId
     - wineId
     - timestamp
     - taste: 1-5
     - mouthfeel: 1-5
     - dryness: 1-5
     - value: 1-5
     - [other dimensions]
     - overallRating
     - notes
     - imageUrls: [url1, url2, ...]
     - location
     - isPublic
   
   /collections/{collectionId}
     - userId
     - name
     - description
     - wines: [wineId1, wineId2, ...]
     - isPublic
   ```

### Core Components Implementation

#### 1. Authentication System

```jsx
// src/screens/AuthScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  async function handleAuth() {
    try {
      if (isLogin) {
        await auth().signInWithEmailAndPassword(email, password);
      } else {
        await auth().createUserWithEmailAndPassword(email, password);
      }
      navigation.navigate('Home');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <Button title={isLogin ? 'Login' : 'Sign Up'} onPress={handleAuth} />
      
      <Text 
        style={styles.toggle}
        onPress={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  error: {
    color: 'red',
    marginBottom: 15,
  },
  toggle: {
    marginTop: 15,
    color: 'blue',
    textAlign: 'center',
  },
});
```

#### 2. Wine Rating Component

```jsx
// src/components/WineRatingForm.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Button, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

export default function WineRatingForm({ route, navigation }) {
  // Wine data from the route params or empty for new entry
  const existingWine = route.params?.wine || null;
  
  const [wineName, setWineName] = useState(existingWine?.name || '');
  const [vineyard, setVineyard] = useState(existingWine?.vineyard || '');
  const [vintage, setVintage] = useState(existingWine?.vintage || '');
  const [varietal, setVarietal] = useState(existingWine?.varietal || '');
  
  // Rating values
  const [taste, setTaste] = useState(3);
  const [mouthfeel, setMouthfeel] = useState(3);
  const [dryness, setDryness] = useState(3);
  const [value, setValue] = useState(3);
  
  // Additional data
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  
  // Calculate overall rating
  const overallRating = ((taste + mouthfeel + dryness + value) / 4).toFixed(1);

  // Handle image picking
  const handleAddImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };
    
    launchImageLibrary(options, response => {
      if (!response.didCancel && !response.error) {
        setImages([...images, response.assets[0].uri]);
      }
    });
  };

  // Handle taking a picture
  const handleTakePicture = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };
    
    launchCamera(options, response => {
      if (!response.didCancel && !response.error) {
        setImages([...images, response.assets[0].uri]);
      }
    });
  };

  // Save the rating
  const saveRating = async () => {
    try {
      const currentUser = auth().currentUser;
      
      // Upload images first
      const imageUrls = [];
      for (const imageUri of images) {
        const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
        const storageRef = storage().ref(`ratings/${currentUser.uid}/${filename}`);
        await storageRef.putFile(imageUri);
        const url = await storageRef.getDownloadURL();
        imageUrls.push(url);
      }
      
      // Create or update wine in database
      let wineId;
      if (existingWine) {
        wineId = existingWine.id;
      } else {
        const wineRef = await firestore().collection('wines').add({
          name: wineName,
          vineyard,
          vintage,
          varietal,
          averageRating: parseFloat(overallRating),
          ratingCount: 1,
        });
        wineId = wineRef.id;
      }
      
      // Save the rating
      await firestore().collection('ratings').add({
        userId: currentUser.uid,
        wineId,
        timestamp: firestore.FieldValue.serverTimestamp(),
        taste,
        mouthfeel,
        dryness,
        value,
        overallRating: parseFloat(overallRating),
        notes,
        imageUrls,
        isPublic,
      });
      
      navigation.navigate('Home', { refresh: true });
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rate Your Wine</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Wine Name</Text>
        <TextInput
          style={styles.input}
          value={wineName}
          onChangeText={setWineName}
          placeholder="Enter wine name"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Vineyard</Text>
        <TextInput
          style={styles.input}
          value={vineyard}
          onChangeText={setVineyard}
          placeholder="Enter vineyard name"
        />
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Vintage</Text>
          <TextInput
            style={styles.input}
            value={vintage}
            onChangeText={setVintage}
            placeholder="Year"
            keyboardType="number-pad"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Varietal</Text>
          <TextInput
            style={styles.input}
            value={varietal}
            onChangeText={setVarietal}
            placeholder="Grape variety"
          />
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Rating</Text>
      
      <View style={styles.ratingContainer}>
        <Text style={styles.label}>Taste: {taste}</Text>
        <Slider
          value={taste}
          onValueChange={setTaste}
          minimumValue={1}
          maximumValue={5}
          step={0.5}
          style={styles.slider}
          minimumTrackTintColor="#8b0000"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#8b0000"
        />
      </View>
      
      <View style={styles.ratingContainer}>
        <Text style={styles.label}>Mouthfeel: {mouthfeel}</Text>
        <Slider
          value={mouthfeel}
          onValueChange={setMouthfeel}
          minimumValue={1}
          maximumValue={5}
          step={0.5}
          style={styles.slider}
          minimumTrackTintColor="#8b0000"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#8b0000"
        />
      </View>
      
      <View style={styles.ratingContainer}>
        <Text style={styles.label}>Dryness: {dryness}</Text>
        <Slider
          value={dryness}
          onValueChange={setDryness}
          minimumValue={1}
          maximumValue={5}
          step={0.5}
          style={styles.slider}
          minimumTrackTintColor="#8b0000"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#8b0000"
        />
      </View>
      
      <View style={styles.ratingContainer}>
        <Text style={styles.label}>Value: {value}</Text>
        <Slider
          value={value}
          onValueChange={setValue}
          minimumValue={1}
          maximumValue={5}
          step={0.5}
          style={styles.slider}
          minimumTrackTintColor="#8b0000"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#8b0000"
        />
      </View>
      
      <View style={styles.overallRating}>
        <Text style={styles.overallText}>Overall Rating</Text>
        <Text style={styles.overallValue}>{overallRating}</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Enter your notes about this wine"
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.imageSection}>
        <Text style={styles.label}>Images</Text>
        <View style={styles.imageButtons}>
          <Button title="Take Picture" onPress={handleTakePicture} color="#8b0000" />
          <Button title="Choose from Gallery" onPress={handleAddImage} color="#8b0000" />
        </View>
        
        <View style={styles.imagePreviewContainer}>
          {images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.imagePreview} />
          ))}
        </View>
      </View>
      
      <View style={styles.saveButtonContainer}>
        <Button title="Save Rating" onPress={saveRating} color="#8b0000" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8b0000',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfInput: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
    color: '#8b0000',
  },
  ratingContainer: {
    marginBottom: 16,
  },
  slider: {
    height: 40,
  },
  overallRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginVertical: 20,
  },
  overallText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b0000',
  },
  overallValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b0000',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginVertical: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 4,
    borderRadius: 4,
  },
  saveButtonContainer: {
    marginVertical: 20,
  },
});
```

#### 3. Social Sharing Component

```jsx
// src/components/ShareWineRating.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ShareWineRating({ route, navigation }) {
  const { ratingId } = route.params;
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth().currentUser;
    
    // Get the current user's friends
    const unsubscribe = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .get()
      .then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          const friendIds = userData.friends || [];
          
          if (friendIds.length > 0) {
            // Fetch friend details
            return firestore()
              .collection('users')
              .where('__name__', 'in', friendIds)
              .get();
          } else {
            return { empty: true };
          }
        }
      })
      .then(snapshot => {
        if (!snapshot.empty) {
          const friendsList = [];
          snapshot.forEach(doc => {
            friendsList.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          setFriends(friendsList);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching friends:', error);
        setLoading(false);
      });
      
    return () => unsubscribe;
  }, []);

  const toggleFriendSelection = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const shareWithFriends = async () => {
    if (selectedFriends.length === 0) return;
    
    try {
      const currentUser = auth().currentUser;
      const batch = firestore().batch();
      
      for (const friendId of selectedFriends) {
        const shareRef = firestore().collection('shares').doc();
        batch.set(shareRef, {
          ratingId,
          fromUserId: currentUser.uid,
          toUserId: friendId,
          timestamp: firestore.FieldValue.serverTimestamp(),
          viewed: false,
        });
      }
      
      await batch.commit();
      navigation.goBack();
    } catch (error) {
      console.error('Error sharing rating:', error);
    }
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        selectedFriends.includes(item.id) && styles.selectedFriend,
      ]}
      onPress={() => toggleFriendSelection(item.id)}
    >
      <Text style={styles.friendName}>{item.displayName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share with Friends</Text>
      
      {loading ? (
        <Text>Loading friends...</Text>
      ) : friends.length === 0 ? (
        <Text>You haven't added any friends yet.</Text>
      ) : (
        <>
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.friendsList}
          />
          
          <TouchableOpacity
            style={[
              styles.shareButton,
              selectedFriends.length === 0 && styles.disabledButton,
            ]}
            onPress={shareWithFriends}
            disabled={selectedFriends.length === 0}
          >
            <Text style={styles.shareButtonText}>
              Share with {selectedFriends.length} {selectedFriends.length === 1 ? 'friend' : 'friends'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8b0000',
  },
  friendsList: {
    paddingBottom: 16,
  },
  friendItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedFriend: {
    backgroundColor: '#ffe6e6',
  },
  friendName: {
    fontSize: 16,
  },
  shareButton: {
    backgroundColor: '#8b0000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
```

### App Navigation

Set up the app navigation structure:

```jsx
// src/navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';

// Auth screens
import AuthScreen from '../screens/AuthScreen';

// Main app screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CameraScreen from '../screens/CameraScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WineRatingForm from '../components/WineRatingForm';
import WineDetailScreen from '../screens/WineDetailScreen';
import ShareWineRating from '../components/ShareWineRating';
import FriendsScreen from '../screens/FriendsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'magnify' : 'magnify';
          } else if (route.name === 'AddRating') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8b0000',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen 
        name="AddRating" 
        component={WineRatingForm}
        options={{
          tabBarLabel: 'Rate Wine',
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(authUser => {
      setUser(authUser);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing]);

  if (initializing) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: '#8b0000' }}>
        {!user ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="WineDetail" component={WineDetailScreen} />
            <Stack.Screen name="ShareRating" component={ShareWineRating} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Deployment & Publishing

### Building for iOS

1. Set up Xcode and iOS development environment
2. Configure app identifier in Xcode project
3. Set up certificates and provisioning profiles
4. Build the app for iOS:
   ```bash
   cd ios
   pod install
   cd ..
   npx react-native run-ios --configuration Release
   ```
5. Archive and distribute through App Store Connect

### Building for Android

1. Set up Android Studio and development environment
2. Configure the app package name in `android/app/build.gradle`
3. Generate a signing key:
   ```bash
   keytool -genkey -v -keystore vinrate.keystore -alias vinrate -keyalg RSA -keysize 2048 -validity 10000
   ```
4. Configure signing in `android/app/build.gradle`
5. Build the app:
   ```bash
   npx react-native run-android --variant=release
   ```
6. Distribute through Google Play Console

## Monetization Options

To keep the app free or low-cost for you as a developer, consider these monetization strategies:

1. **Freemium Model**
   - Basic features free for all users
   - Premium features (advanced analytics, unlimited collection size, etc.) via subscription

2. **In-App Purchases**
   - Custom rating criteria
   - Enhanced photo capabilities
   - Special collection features

3. **Limited Advertising**
   - Tasteful, non-intrusive ads for wine-related products
   - Option for users to remove ads with a one-time purchase

## Maintenance & Updates

### Performance Monitoring

1. Implement Firebase Performance Monitoring
2. Track app crashes and errors
3. Monitor user engagement metrics

### Future Feature Ideas

1. Wine recommendations based on taste preferences
2. Integration with wine purchasing platforms
3. Wine pairing suggestions for meals
4. AR label scanning for instant wine information
5. Tasting event organization and tracking
6. Wine aging predictions and notifications

## Conclusion

This guide provides a comprehensive framework for building a feature-rich, cross-platform wine rating app. By using React Native and Firebase, you can achieve a professional result while keeping development costs low. The modular approach allows you to start with core features and expand over time.

Remember to thoroughly test the app on both iOS and Android devices throughout development, and gather user feedback early to refine the experience.

Good luck with your wine rating app development! 🍷