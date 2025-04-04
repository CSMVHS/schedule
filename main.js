// Global elements to avoid frequent DOM queries
const elements = {
    timeEl: null,
    tempElement: null,
    dateElement: null,
    bar1: null,
    bar1Name: null,
    bar1Remaining: null,
    bar1Progress: null,
    bar2: null,
    bar2Name: null,
    bar2Remaining: null,
    bar2Progress: null
  };
  
  // Cache DOM elements on load
  function cacheElements() {
    elements.timeEl = document.querySelector("div.bar div.clock p.time");
    elements.tempElement = document.querySelector('div.bar div.weather p.temperature');
    elements.dateElement = document.querySelector('div.bar div.date p.date');
    elements.bar1 = document.getElementById('bar1');
    elements.bar1Name = elements.bar1.querySelector('.name');
    elements.bar1Remaining = elements.bar1.querySelector('.remaining');
    elements.bar1Progress = elements.bar1.querySelector('.progress');
    elements.bar2 = document.getElementById('bar2');
    elements.bar2Name = elements.bar2.querySelector('.name');
    elements.bar2Remaining = elements.bar2.querySelector('.remaining');
    elements.bar2Progress = elements.bar2.querySelector('.progress');
  }
  
  // Clock functionality - optimized for performance
  function setupClock() {
    updateTime();  // Initial update
    setInterval(updateTime, 60000); // Update once per minute
  }
  
  function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    elements.timeEl.textContent = `${hours}:${minutes}:${seconds}`;
    
    if (seconds === '00' || seconds === '30') {
      updateScheduleDisplay(); // Update schedule display only every 30 seconds
    }
  }
  
  // Weather functionality - optimized to reduce API calls and processing
  function setupWeather() {
    const apiKey = '7a08aa9c10a1a7edae637fa85fc3ecae';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=Highlands%20Ranch,us&appid=${apiKey}&units=imperial`;
    const CACHE_DURATION = 900000; // 15 minutes in milliseconds
    
    function checkWeatherCache() {
      const cachedTemp = localStorage.getItem("wxTemp");
      const cachedTime = localStorage.getItem("wxTime");
      const now = Date.now();
      
      if (cachedTemp && cachedTime && (now - cachedTime) < CACHE_DURATION) {
        elements.tempElement.textContent = `${cachedTemp}°`;
        return true;
      }
      return false;
    }
    
    function fetchWeather() {
      if (checkWeatherCache()) return;
      
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          if (data.main) {
            const temp = Math.round(data.main.temp);
            elements.tempElement.textContent = `${temp}°`;
            localStorage.setItem("wxTemp", temp);
            localStorage.setItem("wxTime", Date.now());
          }
        })
        .catch(() => elements.tempElement.textContent = "ERR");
    }
    
    if (!checkWeatherCache()) fetchWeather();
    setInterval(fetchWeather, 300000); // Update every 5 minutes
  }
  
  // Date functionality - optimized to update only when needed
  function setupDate() {
    function updateDate() {
      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      elements.dateElement.textContent = `${month}/${day}`;
    }
    
    updateDate();
    setInterval(updateDate, 86400000); // Update once every 24 hours
  }
  
  // Schedule class - optimized for memory and performance
  class Schedule {
    constructor(scheduleString) {
      this.periods = this.parseSchedule(scheduleString);
    }
    
    parseSchedule(scheduleString) {
      return scheduleString.split(',').map(part => {
        const [startTime, name, endTime] = part.split(';');
        return { startTime, name, endTime: endTime || null };
      });
    }
  }
  
  // Time utility functions
  const timeUtils = {
    timeToMinutes: timeString => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    },
    formatRemaining: minutes => {
      if (minutes < 1) return `${Math.floor(minutes * 60)} sec`;
      const hrs = Math.floor(minutes / 60);
      const mins = Math.floor(minutes % 60);
      return `${hrs ? `${hrs} hr ` : ''}${mins ? `${mins} min` : ''}`;
    },
    formatTime: (hours, minutes) => `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  };
  
  // Schedule data - daily schedules
  const scheduleData = {
    1: ["7:00;Good Morning!;7:30", "10:58;Passing Period;11:03"],
    2: ["7:00;Good Morning!;7:30", "10:56;Passing Period;11:01"],
    3: ["7:00;Good Morning!;7:30", "10:58;Passing Period;11:03"],
    4: ["7:00;Good Morning!;7:30", "10:56;Passing Period;11:01"],
    5: ["7:00;Good Morning!;7:30", "11:24;Passing Period;11:29"]
  };
  
  let currentSchedules = [null, null];
  
  // Initialize schedules for the current day
  function initializeSchedules() {
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek > 0 && dayOfWeek < 6) {
      const daySchedules = scheduleData[dayOfWeek];
      if (daySchedules) {
        currentSchedules[0] = new Schedule(daySchedules[0]);
        currentSchedules[1] = new Schedule(daySchedules[1]);
      }
    }
  }
  
  // Get current period information
  function getCurrentPeriodInfo(scheduleObj, currentTimeInMinutes) {
    if (!scheduleObj) return { inSession: false };
    for (const period of scheduleObj.periods) {
      const startTimeMinutes = timeUtils.timeToMinutes(period.startTime);
      const endTimeMinutes = period.endTime ? timeUtils.timeToMinutes(period.endTime) : startTimeMinutes;
      if (currentTimeInMinutes >= startTimeMinutes && currentTimeInMinutes < endTimeMinutes) {
        const progress = ((currentTimeInMinutes - startTimeMinutes) / (endTimeMinutes - startTimeMinutes)) * 100;
        return { inSession: true, name: period.name, progress: progress.toFixed(1) };
      }
    }
    return { inSession: false };
  }
  
  // Update the schedule display
  function updateScheduleDisplay() {
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const scheduleInfo = getCurrentPeriodInfo(currentSchedules[0], currentTimeInMinutes);
    
    if (scheduleInfo.inSession) {
      elements.bar1Name.textContent = scheduleInfo.name;
      elements.bar1Progress.style.width = `${scheduleInfo.progress}%`;
      elements.bar1.style.display = 'flex';
    } else {
      elements.bar1.style.display = 'none';
    }
    
    if (currentSchedules[1] && getCurrentPeriodInfo(currentSchedules[1], currentTimeInMinutes).inSession) {
      elements.bar2.style.display = 'flex';
    } else {
      elements.bar2.style.display = 'none';
    }
  }
  
  // Initialize everything
  function init() {
    cacheElements();
    initializeSchedules();
    setupClock();
    setupWeather();
    setupDate();
    updateScheduleDisplay();
  }
  
  document.addEventListener('DOMContentLoaded', init);
  