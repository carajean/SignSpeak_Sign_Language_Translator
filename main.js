import { KNNImageClassifier } from 'deeplearn-knn-image-classifier';
import * as dl from 'deeplearn';
import TextToSpeech from './SpeechComponents/TextToSpeech.js';

const IMAGE_SIZE = 227; // webcam image size; must be 227
const TOPK = 10; // K value for KNN
const predictionThreshold = 0.98;

let words = ['ready', 'hello', 'how-are', 'you', 'finish', 'other'];
export let endWords = ['finish'];

class Main {
  constructor() {
    // initiate variables
    this.infoTexts = [];
    this.training = -1; // when no class is being trained
    this.videoPlaying = false;
    this.previousPrediction = -1;
    this.currentPredictedWords = [];

    // variables to restrict prediction rate
    this.then = Date.now();
    this.startTime = this.then;
    this.fps = 5; // framerate (predictions per second)
    this.fpsInterval = 1000 / this.fps;
    this.elapsed = 0;

    this.trainingListDiv = document.getElementById('training-list');
    this.exampleListDiv = document.getElementById('example-list');
    this.knn = null;
    this.textLine = document.getElementById('text');
    this.video = document.getElementById('video');
    this.addWordForm = document.getElementById('add-word');
    this.statusText = document.getElementById('status-text');

    this.video.addEventListener('mousedown', () => {
      // click on video to go back to training buttons
      main.pausePredicting();
      this.trainingListDiv.style.display = 'block';
    });

    // add word to training example set
    this.addWordForm.addEventListener('submit', e => {
      e.preventDefault();
      let word = document
        .getElementById('new-word')
        .value.trim()
        .toLowerCase();

      if (word && !words.includes(word)) {
        words.splice(words.length - 2, 0, word); // before endWord
        this.createButtonList(false);
        this.updateExampleCount();
        document.getElementById('new-word').value = '';
      } else {
        alert('Duplicate word or no word entered');
      }
    });

    this.updateExampleCount();
    document.getElementById('status').style.display = 'none';
    this.createTrainingBtn();
    this.createButtonList(false);

    // load text to speech
    this.tts = new TextToSpeech();
  }

  createPredictBtn() {
    let div = document.getElementById('action-btn');
    div.innerHTML = '';
    const predButton = document.createElement('button');

    predButton.innerText = 'Start Conversation!';
    div.appendChild(predButton);

    predButton.addEventListener('mousedown', () => {
      console.log('start predicting');
      const exampleCount = this.knn.getClassExampleCount();

      // check if training has been done
      if (Math.max(...exampleCount) > 0) {
        if (exampleCount.some(e => e === 0)) {
          alert(`More training please!`);
          return;
        }

        this.trainingListDiv.style.display = 'none';
        this.textLine.classList.remove('intro-steps');
        this.textLine.innerText = 'Start signing';
        this.startPredicting();
      } else {
        alert(
          `You haven't added any examples yet.\n\nPress and hold on the "Add Example" button next to each word while performing the sign in front of the webcam.`
        );
      }
    });
  }

  createTrainingBtn() {
    let div = document.getElementById('action-btn');
    div.innerHTML = '';

    const trainButton = document.createElement('button');
    trainButton.innerText = 'Train Signs';
    div.appendChild(trainButton);

    trainButton.addEventListener('mousedown', () => {
      this.startWebcam();

      console.log('ready to train');
      this.createButtonList(true);
      this.addWordForm.innerHTML = '';

      this.loadKNN();
      this.createPredictBtn();
      this.textLine.innerText = 'Train Signs';
    });
  }

  areTerminalWordsTrained(exampleCount) {
    let totalTerminalWordsTrained = 0;
    for (let i = 0; i < words.length; i++) {
      if (endWords.includes(words[i])) {
        if (exampleCount[i] > 0) {
          totalTerminalWordsTrained += 1;
        }
      }
    }
    return totalTerminalWordsTrained;
  }

  startWebcam() {
    // Setup webcam
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        this.video.srcObject = stream;
        this.video.width = IMAGE_SIZE;
        this.video.height = IMAGE_SIZE;

        this.video.addEventListener(
          'playing',
          () => (this.videoPlaying = true)
        );
        this.video.addEventListener(
          'paused',
          () => (this.videoPlaying = false)
        );
      });
  }

  loadKNN() {
    this.knn = new KNNImageClassifier(words.length, TOPK);

    // Load knn model
    this.knn.load().then(() => this.startTraining());
  }

  updateExampleCount() {
    let p = document.getElementById('count');
    p.innerText = `Training: ${words.length} words`;
  }

  createButtonList(showBtn) {
    // Clear List
    this.exampleListDiv.innerHTML = '';

    // Create training buttons and info texts
    for (let i = 0; i < words.length; i++) {
      this.createButton(i, showBtn);
    }
  }

  createButton(i, showBtn) {
    const div = document.createElement('div');
    this.exampleListDiv.appendChild(div);
    div.style.marginBottom = '10px';

    // Create Word Text
    const wordText = document.createElement('span');
    if (i === 0 && !showBtn) {
      wordText.innerText = words[i].toUpperCase() + ' (ready to sign) ';
    } else if (i === words.length - 2 && !showBtn) {
      wordText.innerText = words[i].toUpperCase() + ' (done signing) ';
    } else if (i === words.length - 1 && !showBtn) {
      wordText.innerText = words[i].toUpperCase() + ' (neutral) ';
    } else {
      wordText.innerText = words[i].toUpperCase() + ' ';
      wordText.style.fontWeight = 'bold';
    }

    div.appendChild(wordText);

    if (showBtn) {
      // Create training button
      const button = document.createElement('button');
      button.innerText = 'Add Example';
      div.appendChild(button);

      // Listen for mouse events when clicking the button
      button.addEventListener('mousedown', () => (this.training = i));
      button.addEventListener('mouseup', () => (this.training = -1));

      // Create clear button to emove training examples
      const btn = document.createElement('button');
      btn.innerText = 'Clear';
      div.appendChild(btn);

      btn.addEventListener('mousedown', () => {
        console.log(`cleared training data for: ${words[i]}`);
        this.knn.clearClass(i);
        this.infoTexts[i].innerText = ' 0 examples';
      });

      // Create info text
      const infoText = document.createElement('span');
      infoText.innerText = ' 0 examples';
      div.appendChild(infoText);
      this.infoTexts.push(infoText);
    }
  }

  startTraining() {
    if (this.timer) {
      this.stopTraining();
    }
    let promise = this.video.play();

    if (promise !== undefined) {
      promise
        .then(_ => {
          console.log('waiting to train');
        })
        .catch(error => {
          if (error) console.error(error);
          else console.log('stopped training');
        });
    }
    this.timer = requestAnimationFrame(this.train.bind(this));
  }

  stopTraining() {
    this.video.pause();
    cancelAnimationFrame(this.timer);
  }

  train() {
    if (this.videoPlaying) {
      // Get image data from video element
      const image = dl.fromPixels(this.video);
      if (this.training !== -1) {
        // Add current image to classifier
        this.knn.addImage(image, this.training);
        console.log(`trained: ${words[this.training]}`);
      }
      const exampleCount = this.knn.getClassExampleCount();
      if (Math.max(...exampleCount) > 0) {
        for (let i = 0; i < words.length; i++) {
          if (exampleCount[i] > 0) {
            this.infoTexts[i].innerText = ` ${exampleCount[i]} examples`;
          }
        }
      }
    }
    this.timer = requestAnimationFrame(this.train.bind(this));
  }

  startPredicting() {
    // stop training
    if (this.timer) {
      this.stopTraining();
    }
    document.getElementById('status').style.background = 'deepskyblue';
    this.setStatusText('Status: Ready!');
    this.video.play();
    this.pred = requestAnimationFrame(this.predict.bind(this));
  }

  pausePredicting() {
    console.log('interpreter paused');
    this.setStatusText('Status: Paused Predicting');
    cancelAnimationFrame(this.pred);
  }

  predict() {
    this.now = Date.now();
    this.elapsed = this.now - this.then;
    if (this.elapsed > this.fpsInterval) {
      this.then = this.now - (this.elapsed % this.fpsInterval);

      if (this.videoPlaying) {
        const exampleCount = this.knn.getClassExampleCount();
        const image = dl.fromPixels(this.video);
        if (Math.max(...exampleCount) > 0) {
          this.knn
            .predictClass(image)
            .then(res => {
              for (let i = 0; i < words.length; i++) {
                // if word is above threshold, was not previously predicted, and is not the catchall class
                if (
                  res.classIndex === i &&
                  res.confidences[i] > predictionThreshold &&
                  res.classIndex !== this.previousPrediction &&
                  res.classIndex !== words.length - 1
                ) {
                  this.tts.speak(words[i]);

                  // set previous prediction so it doesnt get called again
                  this.previousPrediction = res.classIndex;
                }
              }
            })
            .then(() => image.dispose());
        } else {
          image.dispose();
        }
      }
    }

    this.pred = requestAnimationFrame(this.predict.bind(this));
  }

  setStatusText(status) {
    document.getElementById('status').style.display = 'block';
    this.statusText.innerText = status;
  }
}

let main = null;

window.addEventListener('load', () => {
  main = new Main();
});
