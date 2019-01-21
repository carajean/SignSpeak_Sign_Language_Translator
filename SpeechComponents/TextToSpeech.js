import SpeechToText from './SpeechToText.js';
import { endwords } from '../main.js';

export default class TextToSpeech {
  constructor() {
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
      main.previousPrediction = -1;
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

    // if(endWords.includes(word) && this.currentPredictedWords.length == 1 && (word != "hello" && word != "bye")){
    //   console.log("end word detected early")
    //   console.log(word)
    //   return;
    // }

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
