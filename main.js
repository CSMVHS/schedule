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
    // Update time immediately
    updateTime();
    
    // Then sync to the second and update every second
    const now = new Date();
    const ms = now.getMilliseconds();
    const timeToNextSecond = 1000 - ms;
    
    // Wait until the next second starts to begin interval
    setTimeout(() => {
      updateTime();
      // Set interval precisely on the second
      setInterval(updateTime, 1000);
    }, timeToNextSecond);
  }
  
  function updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    elements.timeEl.textContent = `${hours}:${minutes}:${seconds}`;
    
    // Only update schedule when seconds are 0, 15, 30, 45 to reduce processing
    if (seconds === '00' || seconds === '15' || seconds === '30' || seconds === '45') {
      updateScheduleDisplay();
    }
  }
  
  // Weather functionality - optimized to reduce API calls and processing
  function setupWeather() {
    const apiKey = '7a08aa9c10a1a7edae637fa85fc3ecae';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=Highlands%20Ranch,us&appid=${apiKey}&units=imperial`;
    const CACHE_DURATION = 900000; // 15 minutes in milliseconds
    const REFRESH_INTERVAL = 300000; // 5 minutes in milliseconds
    
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
      // Don't fetch if cache is still valid
      if (checkWeatherCache()) return;
      
      fetch(apiUrl)
        .then(response => {
          if (!response.ok) throw new Error(`Error: ${response.status}`);
          return response.json();
        })
        .then(data => {
          if (data.main) {
            const temp = Math.round(data.main.temp);
            elements.tempElement.textContent = `${temp}°`;
            localStorage.setItem("wxTemp", temp);
            localStorage.setItem("wxTime", Date.now());
          }
        })
        .catch(error => {
          console.error("Weather error:", error);
          elements.tempElement.textContent = "ERR";
        });
    }
    
    // Initial weather check
    if (!checkWeatherCache()) {
      fetchWeather();
    }
    
    // Periodic weather updates
    setInterval(fetchWeather, REFRESH_INTERVAL);
  }
  
  // Date functionality - optimized to update only when needed
  function setupDate() {
    function updateDate() {
      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      elements.dateElement.textContent = `${month}/${day}`;
    }
    
    // Update date initially
    updateDate();
    
    // Calculate time until midnight for next update
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow - now;
    
    // Set up update at midnight
    setTimeout(() => {
      updateDate();
      // Then update every 24 hours
      setInterval(updateDate, 86400000);
    }, msUntilMidnight);
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
    // Convert time string (HH:MM) to minutes since midnight
    timeToMinutes: timeString => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + (minutes || 0);
    },
    
    // Format remaining time in a readable way
    formatRemaining: minutes => {
      if (minutes < 1) {
        return `${Math.floor(minutes * 60)} sec`;
      }
      
      const hrs = Math.floor(minutes / 60);
      const mins = Math.floor(minutes % 60);
      
      if (hrs === 0) return `${mins} min`;
      if (mins === 0) return `${hrs} hr`;
      return `${hrs} hr ${mins} min`;
    },
    
    // Format time as HH:MM
    formatTime: (hours, minutes) => {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  };
  
  // Schedule data - daily schedules
  const scheduleData = {
    // Monday
    1: [
      "7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50",
      "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"
    ],
    // Tuesday
    2: [
      "7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;S.A.S.;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50",
      "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"
    ],
    // Wednesday
    3: [
      "7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50",
      "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"
    ],
    // Thursday
    4: [
      "7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;Eagle Time;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50",
      "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"
    ],
    // Friday
    5: [
      "7:00;Happy Friday!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;8:36,8:36;Passing Period;8:41,8:41;Period 2;9:32,9:32;Passing Period;9:37,9:37;Period 3;10:28,10:28;Passing Period;10:33,10:33;Period 4;11:24,11:24;A Lunch;12:02,12:02;Passing Period;12:07,12:07;Period 5;12:58,12:58;Passing Period;13:03,13:03;Period 6;13:54,13:54;Passing Period;13:59,13:59;Period 7;14:50",
      "11:24;Passing Period;11:29,11:29;Period 5;12:20,12:20;B Lunch;12:58"
    ]
  };
  
  // Cache for daily schedules
  let currentSchedules = [null, null];
  
  // Initialize schedules for the current day
  function initializeSchedules() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Clear current schedules
    currentSchedules = [null, null];
    
    // Only initialize if it's a weekday
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
    
    const now = new Date();
    const currentSeconds = now.getSeconds();
    
    // Check each period in the schedule
    for (const period of scheduleObj.periods) {
      if (!period.startTime || !period.endTime) continue;
      
      const startTimeMinutes = timeUtils.timeToMinutes(period.startTime);
      const endTimeMinutes = timeUtils.timeToMinutes(period.endTime);
      
      // Check if current time is within this period
      if (currentTimeInMinutes >= startTimeMinutes && currentTimeInMinutes < endTimeMinutes) {
        // Calculate progress
        const totalDuration = endTimeMinutes - startTimeMinutes;
        const elapsed = currentTimeInMinutes - startTimeMinutes;
        const remaining = endTimeMinutes - currentTimeInMinutes;
        
        // Adjust for seconds
        const remainingWithSeconds = remaining - (currentSeconds / 60);
        const progress = (elapsed / totalDuration) * 100 + (currentSeconds / 60 / totalDuration * 100);
        
        return {
          inSession: true,
          name: period.name,
          timeRemaining: timeUtils.formatRemaining(remainingWithSeconds),
          progress: progress.toFixed(1)
        };
      }
    }
    
    return { inSession: false };
  }
  
  // Find the next period
  function getNextPeriodInfo(schedules, currentTimeInMinutes) {
    const allPeriods = [];
    const now = new Date();
    const currentSeconds = now.getSeconds();
    
    // Collect all periods from both schedules
    for (const schedule of schedules) {
      if (!schedule) continue;
      
      for (const period of schedule.periods) {
        if (period.startTime && period.endTime) {
          const startTimeMinutes = timeUtils.timeToMinutes(period.startTime);
          // Avoid duplicates
          if (!allPeriods.some(p => p.startTimeMinutes === startTimeMinutes && p.name === period.name)) {
            allPeriods.push({
              name: period.name,
              startTime: period.startTime,
              startTimeMinutes
            });
          }
        }
      }
    }
    
    // Sort periods by start time
    allPeriods.sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
    
    // Find the next period
    for (const period of allPeriods) {
      if (period.startTimeMinutes > currentTimeInMinutes) {
        const timeUntilStart = period.startTimeMinutes - currentTimeInMinutes;
        const timeUntilStartWithSeconds = timeUntilStart - (currentSeconds / 60);
        
        return {
          available: true,
          name: period.name,
          timeUntilStart: timeUtils.formatRemaining(timeUntilStartWithSeconds)
        };
      }
    }
    
    return { available: false };
  }
  
  // Get current schedule information
  function getCurrentScheduleInfo() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Skip if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        inSession: false,
        message: "Weekend - No School",
        needsTwoProgressBars: false
      };
    }
    
    // Check if we have valid schedules
    if (!currentSchedules[0]) {
      return {
        inSession: false,
        message: "No schedule available",
        needsTwoProgressBars: false
      };
    }
    
    // Get info for schedule A (main schedule)
    const scheduleAInfo = getCurrentPeriodInfo(currentSchedules[0], currentTime);
    
    // Get info for schedule B (alternative schedule)
    const scheduleBInfo = getCurrentPeriodInfo(currentSchedules[1], currentTime);
    
    // Determine if we need both progress bars
    const needsTwoProgressBars = scheduleBInfo.inSession;
    
    return {
      inSession: scheduleAInfo.inSession || scheduleBInfo.inSession,
      needsTwoProgressBars,
      scheduleA: scheduleAInfo,
      scheduleB: scheduleBInfo,
      nextPeriod: getNextPeriodInfo(currentSchedules, currentTime)
    };
  }
  
  // Update the schedule display
  function updateScheduleDisplay() {
    const scheduleInfo = getCurrentScheduleInfo();
    
    // Handle schedule A display (main schedule)
    if (scheduleInfo.inSession) {
      // Get info to display (either active period or next period)
      const displayInfo = scheduleInfo.scheduleA.inSession ? scheduleInfo.scheduleA : 
                         (scheduleInfo.nextPeriod && scheduleInfo.nextPeriod.available ? 
                          { name: `Next: ${scheduleInfo.nextPeriod.name}`, timeRemaining: `in ${scheduleInfo.nextPeriod.timeUntilStart}` } : 
                          { name: "No more periods today", timeRemaining: "" });
      
      // Update bar1 display
      elements.bar1Name.textContent = displayInfo.name;
      elements.bar1Remaining.textContent = displayInfo.timeRemaining || "";
      
      // Update progress if in session
      if (scheduleInfo.scheduleA.inSession) {
        elements.bar1Progress.style.width = `${scheduleInfo.scheduleA.progress}%`;
        elements.bar1.classList.add('active');
      } else {
        elements.bar1Progress.style.width = '0%';
        elements.bar1.classList.remove('active');
      }
      
      elements.bar1.style.display = 'flex';
    } else {
      // Nothing in session
      elements.bar1.style.display = 'none';
    }
    
    // Handle schedule B display (only shown during B lunch periods)
    if (scheduleInfo.needsTwoProgressBars && scheduleInfo.scheduleB.inSession) {
      elements.bar2Name.textContent = scheduleInfo.scheduleB.name;
      elements.bar2Remaining.textContent = scheduleInfo.scheduleB.timeRemaining;
      elements.bar2Progress.style.width = `${scheduleInfo.scheduleB.progress}%`;
      elements.bar2.classList.add('active');
      elements.bar2.style.display = 'flex';
    } else {
      elements.bar2.style.display = 'none';
    }
  }
  
  // Check for admin commands - reduced polling frequency
  async function checkCommands() {
    try {
      const devLink = "https://script.google.com/macros/s/AKfycbxZe6A-GKnGcv9efNxrMeSNvxcYC2MhOvqQkQLNpIiQOqcJCSuCTauq0k7Pwuz4OIcf/exec";
      const response = await fetch(devLink); 
      const command = await response.text();
  
      if (command === "refresh") {
        location.reload();
      } else if (command === "wipe-storage") {
        localStorage.clear();
      }
      
      // Check commands every 5 minutes instead of constantly
      setTimeout(checkCommands, 300000);
    } catch (error) {
      console.error("Command check error:", error);
      // Retry after 5 minutes
      setTimeout(checkCommands, 300000);
    }
  }
  
  // Initialize everything
  function init() {
    // Cache DOM elements
    cacheElements();
    
    // Initialize schedules
    initializeSchedules();
    
    // Set up clock
    setupClock();
    
    // Set up weather
    setupWeather();
    
    // Set up date
    setupDate();
    
    // Set up schedules
    updateScheduleDisplay();
    
    // Check for admin commands
    checkCommands();
    
    // Reset schedules at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
      initializeSchedules();
    }, timeUntilMidnight);
  }
  
  // Start everything
  document.addEventListener('DOMContentLoaded', init);