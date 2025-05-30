// utils/firebaseConfig.js
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyCrEoZG7XYU21J69NaVQ_N2p3zggkkU7aw',
  authDomain: 'fm-city-fest.firebaseapp.com',
  projectId: 'fm-city-fest',
  storageBucket: 'fm-city-fest.appspot.com',
  messagingSenderId: '669881751446',
  appId: '1:669881751446:web:290491b5d906d47d676fb7',
};

export const firebaseApp = initializeApp(firebaseConfig);
