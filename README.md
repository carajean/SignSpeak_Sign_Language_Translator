# Carolyn's Stackathon Project

My original vision for this project was to build upon Shekit's work of making a sign language-voice translator. I wanted to enable model saving & loading functionality, so the user doesn't have to train the words from scratch if they refresh the page or navigate away.

Here are two open-source American Sign Language database that I was unable to integrate into this project:
http://www-i6.informatik.rwth-aachen.de/~dreuw/database-rwth-boston-50.php
http://www-i6.informatik.rwth-aachen.de/~dreuw/database-rwth-boston-104.php

I am new to TensorFlow & machine learning, so deciphering the database's python scripts was beyond me in the scope of this short project. I learned that in TensorFlow.js, not all models share functionality (ie, KNNImageClassifier cannot load/save). I attempted several workarounds but was unsuccessful.

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

Based in part on https://github.com/shekit/alexa-sign-language-translator.git
and https://github.com/googlecreativelab/teachable-machine.git

## Reference

Learn more about TensorFlow.js here https://github.com/googlecreativelab/teachable-machine.git
