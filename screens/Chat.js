import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { TouchableOpacity, Text, View, Image } from 'react-native';
import { Video } from 'expo-av';
import { GiftedChat } from 'react-native-gifted-chat';
import { collection, addDoc, orderBy, query, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, database } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import colors from '../colors';
import { launchImageLibraryAsync } from 'expo-image-picker';

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
        const collectionRef = collection(database, 'chats');
        const q = query(collectionRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, querySnapshot => {
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
        });

        return () => unsubscribe();
    }, []);


    // Function to send messages to Firestore
    const handleSend = useCallback((newMessages = []) => {
        const formattedMessages = newMessages.map(message => ({
            ...message,
            createdAt: message.createdAt.toISOString(),
        }));

        setMessages(previousMessages => GiftedChat.append(previousMessages, formattedMessages));

        formattedMessages.forEach(message => {
            addDoc(collection(database, 'chats'), message)
                .then(() => console.log('Message added successfully'))
                .catch(error => console.error('Error adding message: ', error));
        });
    }, []);

    // Function to handle image picker
    const handleImagePicker = async () => {
        let result = await launchImageLibraryAsync({
            mediaTypes: 'Images',
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.cancelled) {
            const imageMessage = {
                _id: Math.random().toString(36).substring(7),
                createdAt: new Date(),
                user: {
                    _id: auth.currentUser.email,
                    avatar: auth.currentUser.photoURL || 'https://picsum.photos/id/237/200/300',
                },
                image: result.uri,
            };
            handleSend([imageMessage]);
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

    return (
        <View style={{ flex: 1 }}>
            <GiftedChat
                messages={messages}
                onSend={newMessages => handleSend(newMessages)}
                renderMessageImage={props => <Image source={{ uri: props.currentMessage.image }} style={{ width: 200, height: 200 }} />}
                renderMessageVideo={props => <Video source={{ uri: props.currentMessage.video }} style={{ width: 200, height: 200 }} resizeMode="cover" useNativeControls />}
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
