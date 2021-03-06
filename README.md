# Carolyn's Stackathon Project

My original vision for this project was to build a sign language-voice translator with model saving & loading functionality, such that users don't have to train signs from scratch if they refresh the page or navigate away.

Here are two open-source American Sign Language database that I was unable to integrate into this project:

http://www-i6.informatik.rwth-aachen.de/~dreuw/database-rwth-boston-50.php

http://www-i6.informatik.rwth-aachen.de/~dreuw/database-rwth-boston-104.php

I am new to TensorFlow & machine learning, so deciphering the databases' python scripts was beyond me in the scope of this short project. I learned that in TensorFlow.js, not all model types share functionality (ie, KNNImageClassifier cannot load/save). I attempted several workarounds but was unsuccessful.

Moving forward, I would love to switch to a newer tfjs model that has load/save capabilities. I would like to add fingerspelling functions, such that the concatenated word is spoken rather than individual letters. I would like this project to be deployed as a mobile app for use in the real world. Finally, it would be interesting to incorporate American Sign Language grammar translation, rather than assuming Signed English.

## To run the code:

- fork/clone repo
- cd into project folder
- open terminal and run the following:
  `npm install`
  `npm start`
- open localhost:9966 in browser
- enjoy!

## Credit

Based in part on https://github.com/googlecreativelab/teachable-machine.git and https://github.com/shekit/alexa-sign-language-translator.git

## Reference

Learn more about TensorFlow.js here https://js.tensorflow.org/#getting-started
