import { KNNImageClassifier } from 'deeplearn-knn-image-classifier';
import * as dl from 'deeplearn';

const IMAGE_SIZE = 227; // webcam image size; must be 227
const TOPK = 10; // K value for KNN
const predictionThreshold = 0.98;

let words = ['ready', 'hello', 'how-are', 'you', 'finish', 'other'];
let endWords = ['finish'];

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

    // main elements
    this.trainingListDiv = document.getElementById('training-list');
    this.exampleListDiv = document.getElementById('example-list');
    this.knn = null;
    this.textLine = document.getElementById('text');
    this.video = document.getElementById('video');
    this.addWordForm = document.getElementById('add-word');
    this.right = document.getElementById('split-right');
    this.left = document.getElementById('split-left');
    this.main = document.getElementById('main');
    this.statusText = document.getElementById('status-text');

    this.video.style.display = 'none';
    this.video.addEventListener('mousedown', () => {
      // click on video to go back to training buttons
      this.main.pausePredicting();
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

  createTrainingBtn() {
    let div = document.getElementById('action-btn');
    div.innerHTML = '';

    const trainButton = document.createElement('button');
    trainButton.classList.add('trainBtn');
    trainButton.innerText = 'Train';
    div.appendChild(trainButton);

    trainButton.addEventListener('click', () => {
      this.main.style.width = '60%';
      this.video.style.display = 'inline';
      this.right.style.display = 'inline';
      this.textLine.classList.add('addSignBtn');
      this.textLine.innerText = 'Train Signs';
      this.addWordForm.style.display = 'none';

      this.createButtonList(true);
      this.startWebcam();
      this.loadKNN();
      this.createPredictBtn();

      console.log('ready to train');
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

  // eslint-disable-next-line max-statements
  createButton(i, showBtn) {
    const div = document.createElement('div');
    div.style.marginBottom = '10px';
    this.exampleListDiv.appendChild(div);

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

    div.style.padding = '0 5px';
    div.appendChild(wordText);

    if (showBtn) {
      // Create training button
      this.exampleListDiv.classList.add('wordListWithBtns');
      const button = document.createElement('button');
      button.classList.add('trainingBtns');
      button.classList.add('addExBtns');
      button.style.margin = '0 5px';
      button.innerText = 'Add Example';
      div.appendChild(button);

      // Listen for mouse events when clicking the button
      button.addEventListener('mousedown', () => (this.training = i));
      button.addEventListener('mouseup', () => (this.training = -1));

      // Create clear button to emove training examples
      const btn = document.createElement('button');
      btn.classList.add('trainingBtns');
      btn.classList.add('clearBtns');
      btn.style.margin = '0 5px';
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
      infoText.style.margin = '0 5px';
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

  createPredictBtn() {
    let div = document.getElementById('action-btn');
    div.innerHTML = '';
    const predButton = document.createElement('button');
    predButton.id = 'predBtn';
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

class TextToSpeech {
  constructor() {
    this.main = document.getElementById('main');
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.pitch = 1.0;
    this.rate = 0.9;

    this.textLine = document.getElementById('text');
    this.ansText = document.getElementById('answerText');
    this.loader = document.getElementById('loader');

    this.selectedVoice = 48; // this is Google-US en. Can set voice and language of choice

    this.currentPredictedWords = [];
    this.waitTimeForQuery = 5000;

    this.synth.onvoiceschanged = () => {
      this.populateVoiceList();
    };
  }

  populateVoiceList() {
    if (typeof speechSynthesis === 'undefined') {
      console.log('no synth');
      return;
    }
    this.voices = this.synth.getVoices();

    if (this.voices.indexOf(this.selectedVoice) > 0) {
      console.log(
        `${this.voices[this.selectedVoice].name}:${
          this.voices[this.selectedVoice].lang
        }`
      );
    } else {
      //alert("Selected voice for speech did not load or does not exist.\nCheck Internet Connection")
    }
  }

  clearPara(queryDetected) {
    this.textLine.innerText = '';
    this.ansText.innerText = '';
    if (queryDetected) {
      this.loader.style.display = 'block';
    } else {
      this.loader.style.display = 'none';
      this.ansText.innerText = 'No query detected';
      this.main.previousPrediction = -1;
    }
    this.currentPredictedWords = [];
  }

  speak(word) {
    if (word == 'alexa') {
      console.log('clear para');
      this.clearPara(true);

      setTimeout(() => {
        // if no query detected after alexa is signed
        if (this.currentPredictedWords.length == 1) {
          this.clearPara(false);
        }
      }, this.waitTimeForQuery);
    }

    if (word != 'ready' && this.currentPredictedWords.length == 0) {
      console.log('first word should be ready');
      console.log(word);
      return;
    }

    if (this.currentPredictedWords.includes(word)) {
      // prevent word from being detected repeatedly in phrase
      console.log('word already been detected in current phrase');
      return;
    }

    this.currentPredictedWords.push(word);

    this.textLine.innerText += ' ' + word;

    let utterThis = new SpeechSynthesisUtterance(word);

    utterThis.onend = evt => {
      if (endWords.includes(word)) {
        //if last word is one of end words start listening for transcribing
        console.log('this was the last word');

        main.setStatusText('Status: Waiting for Response');

        let stt = new SpeechToText();
      }
    };

    utterThis.onerror = evt => {
      console.log('Error speaking');
    };

    utterThis.voice = this.voices[this.selectedVoice];

    utterThis.pitch = this.pitch;
    utterThis.rate = this.rate;

    this.synth.speak(utterThis);
  }
}

class SpeechToText {
  constructor() {
    this.interimTextLine = document.getElementById('interimText');
    this.textLine = document.getElementById('answerText');
    this.loader = document.getElementById('loader');
    this.finalTranscript = '';
    this.recognizing = false;

    this.recognition = new webkitSpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.lang = 'en-US';

    this.cutOffTime = 15000; // cut off speech to text after

    this.recognition.onstart = () => {
      this.recognizing = true;
      console.log('started recognizing');
      main.setStatusText('Status: Transcribing');
    };

    this.recognition.onerror = evt => {
      console.log(evt + ' recogn error');
    };

    this.recognition.onend = () => {
      console.log('stopped recognizing');
      if (this.finalTranscript.length == 0) {
        this.type('No response detected');
      }
      this.recognizing = false;

      main.setStatusText('Status: Finished Transcribing');
      // restart prediction after a pause
      setTimeout(() => {
        main.startPredicting();
      }, 1000);
    };

    this.recognition.onresult = event => {
      let interim_transcript = '';
      if (typeof event.results == 'undefined') {
        return;
      }

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.finalTranscript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }

      this.interimType(interim_transcript);
      this.type(this.finalTranscript);
    };

    setTimeout(() => {
      this.startListening();
    }, 0);

    setTimeout(() => {
      this.stopListening();
    }, this.cutOffTime);
  }

  startListening() {
    if (this.recognizing) {
      this.recognition.stop();
      return;
    }

    console.log('listening');

    main.pausePredicting();

    this.recognition.start();
  }

  stopListening() {
    console.log('STOP LISTENING');
    if (this.recognizing) {
      console.log('stop speech to text');
      this.recognition.stop();

      //restart predicting
      main.startPredicting();
      return;
    }
  }

  interimType(text) {
    this.loader.style.display = 'none';
    this.interimTextLine.innerText = text;
  }

  type(text) {
    this.loader.style.display = 'none';
    this.textLine.innerText = text;
  }
}

let main = null;

window.addEventListener('load', () => {
  main = new Main();
});
