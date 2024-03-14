import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { TouchableOpacity, Text, View, Image } from 'react-native';
import { Video } from 'expo-av';
import { GiftedChat } from 'react-native-gifted-chat';
import { collection, orderBy, query, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, database } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import colors from '../colors';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { addMessageToFirestore, uploadImageToFirebase } from '../config/firebase';
import ImageResizer from 'react-native-image-resizer';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const navigation = useNavigation();

    // Function to handle sign out
    const handleSignOut = () => {
        signOut(auth)
            .then(() => console.log('Signed out successfully'))
            .catch(error => console.log('Error signing out: ', error));
    };

    // Set header options
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: 10 }}
                    onPress={handleSignOut}
                >
                    <AntDesign name="logout" size={24} color={colors.gray} style={{ marginRight: 10 }} />
                </TouchableOpacity>
            )
        });
    }, [navigation]);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(database, 'chats'), orderBy('createdAt', 'desc')),
            querySnapshot => {
                const fetchedMessages = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    let createdAt = null;
                    try {
                        createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
                    } catch (error) {
                        console.error('Error parsing createdAt:', error);
                    }
                    return {
                        _id: doc.id,
                        createdAt: createdAt,
                        text: data.text || '',
                        user: data.user,
                        image: data.image || null,
                        video: data.video || null,
                    };
                });
                setMessages(fetchedMessages);
            }
        );

        return () => unsubscribe();
    }, []);


    // Function to send messages to Firestore
    const handleSend = useCallback(async (newMessages = []) => {
        const formattedMessages = newMessages.map(message => {
            const formattedMessage = {
                ...message,
                createdAt: message.createdAt.toISOString(),
                // Ensure that the image field is properly defined
                image: message.image || null,
                // Add any other necessary fields
            };
            return formattedMessage;
        });

        setMessages(previousMessages => GiftedChat.append(previousMessages, formattedMessages));

        try {
            // Use Promise.all to await all the addDoc promises
            await Promise.all(formattedMessages.map(message => addMessageToFirestore(message)));
            console.log('Messages added successfully');
        } catch (error) {
            console.error('Error adding messages: ', error);
        }
    }, []);


    const handleImagePicker = async () => {
        let result = await launchImageLibraryAsync({
            mediaTypes: 'Images',
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.3,
        });

        console.log('Image picker result:', result); // Log the entire result object

        if (result.cancelled) {
            console.log('Image picker canceled');
            return; // Exit the function if the picker was canceled
        }

        // Proceed with handling the selected image if the URI is defined
        if (result?.assets?.length > 0 && result.assets[0].uri) {
            const imageUri = result.assets[0].uri;
            try {
                const fileName = imageUri.split('/').pop(); // Extract file name from the URI
                const downloadUrl = await uploadImageToFirebase(imageUri, fileName);
                console.log('Download URL:', downloadUrl); // Log the download URL
                const imageMessage = {
                    _id: Math.random().toString(36).substring(7),
                    createdAt: new Date(),
                    user: {
                        _id: auth.currentUser.email,
                        avatar: auth.currentUser.photoURL || 'https://picsum.photos/id/237/200/300',
                    },
                    image: downloadUrl,
                };
                handleSend([imageMessage]);
            } catch (error) {
                console.error('Error uploading image to Firebase Storage: ', error);
            }
        } else {
            console.error('Image URI is undefined');
        }
    };


    // Function to handle video picker
    const handleVideoPicker = async () => {
        let result = await launchImageLibraryAsync({
            mediaTypes: 'Videos',
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.5,
        });

        if (!result.cancelled) {
            const videoMessage = {
                _id: Math.random().toString(36).substring(7),
                createdAt: new Date(),
                user: {
                    _id: auth.currentUser.email,
                    avatar: auth.currentUser.photoURL || 'https://picsum.photos/id/237/200/300',
                },
                video: result.uri,
            };
            handleSend([videoMessage]);
        }
    };

    // Function to render image messages
    const renderMessageImage = (props) => {
        const { currentMessage } = props;
        if (currentMessage.image) {
            return (
                <Image
                    source={{ uri: currentMessage.image }}
                    style={{ width: 200, height: 200 }}
                />
            );
        }
        return null;
    };

    // Function to render video messages
    const renderMessageVideo = (props) => {
        const { currentMessage } = props;
        if (currentMessage.video) {
            return (
                <Video
                    source={{ uri: currentMessage.video }}
                    style={{ width: 200, height: 200 }}
                    resizeMode="cover"
                    useNativeControls
                />
            );
        }
        return null;
    };

    return (
        <View style={{ flex: 1 }}>
            <GiftedChat
                messages={messages}
                onSend={newMessages => handleSend(newMessages)}
                renderMessageImage={renderMessageImage}
                renderMessageVideo={renderMessageVideo}
                user={{
                    _id: auth.currentUser.email,
                    avatar: auth.currentUser.photoURL || 'https://picsum.photos/id/237/200/300',
                }}
            />

            <TouchableOpacity onPress={handleImagePicker} style={{ position: 'absolute', bottom: 80, right: 20 }}>
                <Text style={{ fontSize: 18, color: colors.primary }}>Pick Image</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleVideoPicker} style={{ position: 'absolute', bottom: 40, right: 20 }}>
                <Text style={{ fontSize: 18, color: colors.primary }}>Pick Video</Text>
            </TouchableOpacity>
        </View>
    );
}
