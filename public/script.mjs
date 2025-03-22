document.addEventListener('DOMContentLoaded', () => {
  const audioElements = {};
  let isPlaying = false;

  // Initialize audio elements for all sounds (unchanged)
  document.querySelectorAll('input[type="range"]').forEach(slider => {
    const filename = slider.getAttribute('data-filename');
    if (!audioElements[filename]) {
      const audio = new Audio(`/music/stream/${encodeURIComponent(filename)}`);
      audio.volume = 0;
      audio.loop = true;
      audioElements[filename] = audio;
    }

    slider.addEventListener('input', () => {
      const volume = slider.value / 100;
      audioElements[filename].volume = volume;
    });
  });

  // Play/Pause Toggle for All Sounds (unchanged)
  const playPauseButton = document.getElementById('play-pause-button');
  playPauseButton.addEventListener('click', () => {
    if (isPlaying) {
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      playPauseButton.innerHTML = '<i class="fas fa-play"></i> Play All Sounds';
      playPauseButton.classList.remove('pulsing');
    } else {
      Object.values(audioElements).forEach(audio => {
        audio.play();
      });
      playPauseButton.innerHTML = '<i class="fas fa-pause"></i> Pause All Sounds';
      playPauseButton.classList.add('pulsing');
    }
    isPlaying = !isPlaying;
  });

  // Timer functionality
  const startButton = document.getElementById('start-button');
  const pauseButton = document.getElementById('pause-button');
  const stopButton = document.getElementById('stop-button');
  const setDurationButton = document.getElementById('set-duration-button');
  const mindfulnessDurationInput = document.getElementById('mindfulness-duration');
  const durationInputContainer = document.getElementById('duration-input-container');
  const message = document.getElementById('message');
  const progressCircle = document.getElementById('progress-circle');
  const timerText = document.getElementById('timer-text');

  let timer;
  let isRunning = false;
  let isPaused = false;
  let currentDuration = 10 * 60; // Default duration of 10 minutes
  let totalDuration = currentDuration;

  // Function to format time in mm:ss
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Function to update the SVG progress ring and time display
  function updatePieChart() {
    const circumference = 2 * Math.PI * 45; // Circumference of the circle (r=45)
    const percentage = (totalDuration - currentDuration) / totalDuration;
    const offset = circumference * (1 - percentage);
    progressCircle.setAttribute('stroke-dashoffset', offset);
    timerText.textContent = formatTime(currentDuration);
  }

  // Function to start the timer
  function startTimer() {
    if (!isRunning && !isPaused) {
      isRunning = true;
      startButton.classList.add('pulsing');
      durationInputContainer.style.display = 'none'; // Hide input and button
      timer = setInterval(() => {
        currentDuration--;
        updatePieChart();
        if (currentDuration <= 0) {
          clearInterval(timer);
          isRunning = false;
          startButton.classList.remove('pulsing');
          durationInputContainer.style.display = 'flex'; // Show input and button
          message.textContent = 'Mindfulness session complete!';
        }
      }, 1000);
    } else if (isPaused) {
      isPaused = false;
      isRunning = true;
      startButton.classList.add('pulsing');
      durationInputContainer.style.display = 'none'; // Hide input and button
      timer = setInterval(() => {
        currentDuration--;
        updatePieChart();
        if (currentDuration <= 0) {
          clearInterval(timer);
          isRunning = false;
          startButton.classList.remove('pulsing');
          durationInputContainer.style.display = 'flex'; // Show input and button
          message.textContent = 'Mindfulness session complete!';
        }
      }, 1000);
    }
  }

  // Function to pause the timer
  function pauseTimer() {
    if (isRunning) {
      clearInterval(timer);
      isRunning = false;
      isPaused = true;
      startButton.classList.remove('pulsing');
    }
  }

  // Function to stop the timer
  function stopTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    startButton.classList.remove('pulsing');
    durationInputContainer.style.display = 'flex'; // Show input and button
    currentDuration = parseInt(mindfulnessDurationInput.value) * 60;
    totalDuration = currentDuration;
    updatePieChart();
    message.textContent = '';
  }

  // Function to set the duration of the timer
  function setDuration() {
    const duration = parseInt(mindfulnessDurationInput.value);
    if (!isNaN(duration) && duration > 0) {
      currentDuration = duration * 60;
      totalDuration = currentDuration;
      updatePieChart();
    }
  }

  // Event listeners for timer buttons
  startButton.addEventListener('click', startTimer);
  pauseButton.addEventListener('click', pauseTimer);
  stopButton.addEventListener('click', stopTimer);
  setDurationButton.addEventListener('click', setDuration);

  // Initialize the timer display
  updatePieChart();

  // Track selection highlight (unchanged)
  document.querySelectorAll('.track').forEach(track => {
    track.addEventListener('click', () => {
      document.querySelectorAll('.track').forEach(t => t.classList.remove('selected'));
      track.classList.add('selected');
    });
  });

  // Spotify player initialization (unchanged)
  const token = '<%= accessToken %>';
  let currentTrackUri = null;
  let player;

  function initializePlayer() {
    player = new Spotify.Player({
      name: 'Web Playback SDK',
      getOAuthToken: cb => { cb(token); }
    });

    player.connect().then(success => {
      if (success) {
        console.log('The Web Playback SDK successfully connected to Spotify!');
        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          fetch(`https://api.spotify.com/v1/me/player`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device_ids: [device_id], play: false })
          }).catch(error => console.error('Error setting active device:', error));
        });
      }
    });

    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
      player.connect().then(success => {
        if (success) {
          console.log('Reconnected to Spotify!');
        }
      });
    });

    document.querySelectorAll('.play-spotify-button').forEach(button => {
      button.addEventListener('click', () => {
        const uri = button.getAttribute('data-uri');
        const isPlaying = button.textContent === 'Pause';

        if (isPlaying) {
          player.pause().then(() => {
            button.textContent = 'Play';
            currentTrackUri = null;
          }).catch(error => console.error('Error pausing track:', error));
        } else {
          if (currentTrackUri && currentTrackUri !== uri) {
            player.pause().then(() => {
              document.querySelector(`button[data-uri="${currentTrackUri}"]`).textContent = 'Play';
            }).catch(error => console.error('Error pausing current track:', error));
          }
          fetch(`https://api.spotify.com/v1/me/player/play`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uris: [uri] })
          }).then(() => {
            button.textContent = 'Pause';
            currentTrackUri = uri;
          }).catch(error => console.error('Error playing track:', error));
        }
      });
    });
  }

  window.onSpotifyWebPlaybackSDKReady = initializePlayer;
});