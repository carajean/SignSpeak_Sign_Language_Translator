export default class SpeechToText {
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
