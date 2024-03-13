
import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TextInput, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { auth } from '../config/firebase';

export default function Signup({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const clearFields = () => {
        setEmail('');
        setPassword('');
        setUsername('');
    };

    const onHandleSignup = () => {
        if (email !== '' && password !== '' && username !== '') {
            createUserWithEmailAndPassword(auth, email, password)
                .then(() => {
                    auth.currentUser.updateProfile({
                        displayName: username
                    }).then(() => {
                        console.log('Signup success');
                        clearFields();
                    }).catch(error => {
                        console.error('Error updating display name:', error);
                    });
                })
                .catch(err => setError(err.message));
        } else {
            setError('Please fill in all fields');
        }
    };

    return (
        <View style={styles.container}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.title}>Create new account</Text>
            <TextInput
                style={styles.input}
                placeholder='Enter username'
                autoCapitalize='none'
                value={username}
                onChangeText={text => setUsername(text)}
            />
            <TextInput
                style={styles.input}
                placeholder='Enter email'
                autoCapitalize='none'
                keyboardType='email-address'
                textContentType='emailAddress'
                value={email}
                onChangeText={text => setEmail(text)}
            />
            <TextInput
                style={styles.input}
                placeholder='Enter password'
                autoCapitalize='none'
                autoCorrect={false}
                secureTextEntry={true}
                textContentType='password'
                value={password}
                onChangeText={text => setPassword(text)}
            />

            <Button onPress={onHandleSignup} color='#f57c00' title='Signup' />
            <Button
                onPress={() => {
                    navigation.navigate('Login');
                    setError('');
                }}
                title='Go to Login'
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingHorizontal: 12
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#444',
        alignSelf: 'center',
        paddingBottom: 24
    },
    input: {
        backgroundColor: '#fff',
        marginBottom: 20,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12
    },
    error: {
        color: 'red',
        marginBottom: 10,
        alignSelf: 'center'
    }
});
