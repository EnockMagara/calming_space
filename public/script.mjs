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

  // Track selection highlight
  document.querySelectorAll('.track').forEach(track => {
    track.addEventListener('click', (event) => {
      // Only apply highlight if we're not clicking on a button inside the track
      if (!event.target.closest('button')) {
        document.querySelectorAll('.track').forEach(t => t.classList.remove('selected'));
        track.classList.add('selected');
      }
    });
  });

  // Spotify player initialization
  // Get the token from a data attribute instead of template variable
  let spotifyAccessToken = null;
  const spotifyButtons = document.querySelectorAll('.play-spotify-button');
  
  // Only initialize Spotify if we have play buttons (user is authenticated)
  if (spotifyButtons.length > 0) {
    // Try to get the token from a meta tag or data attribute
    const tokenElement = document.querySelector('meta[name="spotify-token"]');
    if (tokenElement) {
      spotifyAccessToken = tokenElement.getAttribute('content');
    }
    
    // If we still don't have a token, try fetching it from the server
    if (!spotifyAccessToken) {
      fetch('/auth/spotify/token')
        .then(response => response.json())
        .then(data => {
          if (data.accessToken) {
            spotifyAccessToken = data.accessToken;
            initializeSpotifyPlayer();
          } else {
            showSpotifyError("Could not retrieve Spotify access token");
          }
        })
        .catch(error => {
          console.error('Error fetching Spotify token:', error);
          showSpotifyError("Error connecting to Spotify");
        });
    } else {
      initializeSpotifyPlayer();
    }
  }

  let currentTrackUri = null;
  let player = null;
  let deviceId = null;

  function showSpotifyError(message) {
    const spotifySection = document.querySelector('.spotify-tracks');
    const errorMsg = document.createElement('p');
    errorMsg.classList.add('spotify-error');
    errorMsg.style.color = 'red';
    errorMsg.textContent = message;
    
    // Remove any existing error messages
    const existingErrors = spotifySection.querySelectorAll('.spotify-error');
    existingErrors.forEach(el => el.remove());
    
    spotifySection.appendChild(errorMsg);
  }

  function initializeSpotifyPlayer() {
    if (!spotifyAccessToken) {
      showSpotifyError("Spotify access token not available");
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      player = new Spotify.Player({
        name: 'Calming Space Web Player',
        getOAuthToken: cb => { cb(spotifyAccessToken); },
        volume: 0.5
      });

      // Error handling
      player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize Spotify player:', message);
        showSpotifyError("Spotify player failed to initialize");
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate with Spotify:', message);
        showSpotifyError("Spotify authentication error. Please try logging in again.");
      });

      player.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message);
        showSpotifyError("Spotify account error. Premium subscription may be required.");
      });

      player.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message);
        showSpotifyError("Playback error: " + message);
      });

      // Ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        deviceId = device_id;
        
        // Transfer playback to this device
        fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${spotifyAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ device_ids: [device_id], play: false })
        }).then(() => {
          console.log('Transferred playback to this device');
          setupSpotifyButtonListeners();
        }).catch(error => {
          console.error('Error transferring playback:', error);
          showSpotifyError("Could not connect to Spotify. Please refresh the page.");
        });
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        deviceId = null;
        showSpotifyError("Spotify player disconnected. Please refresh the page.");
      });

      // Listen for playback state changes to update UI
      player.addListener('player_state_changed', state => {
        if (!state) return;
        
        console.log('Player state changed:', state);
        const currentTrack = state.track_window.current_track;
        const isPaused = state.paused;
        
        // Update button states based on what's actually playing
        spotifyButtons.forEach(button => {
          const uri = button.getAttribute('data-uri');
          const icon = button.querySelector('i');
          
          if (currentTrack && uri === currentTrack.uri && !isPaused) {
            icon.classList.remove('fa-play', 'fa-spinner', 'fa-spin');
            icon.classList.add('fa-pause');
          } else {
            icon.classList.remove('fa-pause', 'fa-spinner', 'fa-spin');
            icon.classList.add('fa-play');
          }
        });
      });

      // Connect to the player
      player.connect().then(success => {
        if (!success) {
          showSpotifyError("Failed to connect to Spotify");
        }
      });
    };

    // Manually trigger the SDK ready event if it's already loaded
    if (window.Spotify && window.Spotify.Player) {
      window.onSpotifyWebPlaybackSDKReady();
    }
  }

  function setupSpotifyButtonListeners() {
    spotifyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const uri = button.getAttribute('data-uri');
        const buttonIcon = button.querySelector('i');
        const isPlaying = buttonIcon.classList.contains('fa-pause');

        // First reset all buttons to play
        spotifyButtons.forEach(btn => {
          const icon = btn.querySelector('i');
          icon.classList.remove('fa-pause');
          icon.classList.add('fa-play');
        });

        if (isPlaying) {
          // Pause the current track
          player.pause().then(() => {
            console.log('Paused track');
            currentTrackUri = null;
          }).catch(error => {
            console.error('Error pausing track:', error);
            showSpotifyError("Failed to pause playback");
          });
        } else {
          // Play the selected track
          if (!deviceId) {
            showSpotifyError("Spotify player not ready. Please refresh the page.");
            return;
          }

          // Show loading state
          buttonIcon.classList.remove('fa-play');
          buttonIcon.classList.add('fa-spinner', 'fa-spin');
          
          fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${spotifyAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uris: [uri] })
          }).then(response => {
            if (!response.ok) {
              return response.json().then(err => {
                throw new Error(`Spotify API error: ${err.error?.message || 'Unknown error'}`);
              });
            }
            buttonIcon.classList.remove('fa-spinner', 'fa-spin');
            buttonIcon.classList.add('fa-pause');
            currentTrackUri = uri;
          }).catch(error => {
            console.error('Error playing track:', error);
            buttonIcon.classList.remove('fa-spinner', 'fa-spin');
            buttonIcon.classList.add('fa-play');
            showSpotifyError(`Playback error: ${error.message || 'Failed to play track'}`);
          });
        }
      });
    });
  }
});