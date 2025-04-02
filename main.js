function updateClock(mod) {
    let now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    const timeEl = document.querySelector("div.bar div.clock p.time");

    if (mod == "init") {
        now = new Date();
        hours = now.getHours().toString().padStart(2, '0');
        minutes = now.getMinutes().toString().padStart(2, '0');
        seconds = now.getSeconds().toString().padStart(2, '0');
        timeEl.innerHTML = `${hours}:${minutes}:${seconds}`
    }

    if (mod == "repeat") {
        let updateInterval = setInterval(() => {
            updateScheduleDisplay();
            now = new Date();
            hours = now.getHours().toString().padStart(2, '0');
            minutes = now.getMinutes().toString().padStart(2, '0');
            seconds = now.getSeconds().toString().padStart(2, '0');
            timeEl.innerHTML = `${hours}:${minutes}:${seconds}`
        }, 1000);
    }
}

function syncClock() {
    let now;
    let ms;
    let checkInterval = setInterval(() => {
        updateClock("init");
        now = new Date;
        ms = now.getMilliseconds();
        if (ms < 150) {
            updateClock("repeat");
            clearInterval(checkInterval);
        }
    }, 140);
}

syncClock();
updateClock("init");

function updateWeather() {
    const tempElement = document.querySelector('div.bar div.weather p.temperature');
    const apiKey = '7a08aa9c10a1a7edae637fa85fc3ecae';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=Highlands%20Ranch,us&appid=${apiKey}&units=imperial`;

    function checkWeatherLocals() {
        let lcTemp = localStorage.getItem("wxTemp");
        let lcTime = localStorage.getItem("wxTime");
        let nowUnix = Date.now();
    
        if (lcTemp && lcTime) {
            if ((nowUnix - lcTime) < 900000) {
                tempElement.innerHTML = `${lcTemp}°`;
                console.log("Reverting to local storage temperature to preserve API calls.", (nowUnix - lcTime)/60000, (nowUnix - lcTime)/9000);
            } else {
                getAPI();
            }
        } else {
            getAPI();
        }
    }

    checkWeatherLocals();

    setInterval(() => {
        checkWeatherLocals();
    }, 30000);

    function getAPI() {
        console.log("Fetching weather from the API...");
    	fetch(apiUrl)
    		.then(response => {
    			if (!response.ok) {
    				// Check if the response was successful (status code 200)
    				throw new Error(`Error fetching weather data: ${response.statusText}`);
    			}
    			return response.json();
    		})
    		.then(data => {
    			if (data.main) {
    				const rawTemp = data.main.temp;
    				const temp = Math.round(rawTemp);

    				if (tempElement) {
    					tempElement.innerHTML = `${temp}°`;
    					localStorage.setItem("wxTemp", temp);
    					localStorage.setItem("wxTime", Date.now());
    				}
    			} else {
    				throw new Error('Missing temperature data');
    			}
    		})
    		.catch(error => {
    			console.error(error);
    			tempElement.innerHTML = "ERR!";
    		});
    }


}

updateWeather();

function updateDate() {
    const dateElement = document.querySelector('div.bar div.date p.date');

    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-11
    const day = now.getDate().toString().padStart(2, '0');
    dateElement.innerHTML = `${month}/${day}`;

    setInterval(() => {
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-11
        const day = now.getDate().toString().padStart(2, '0');
        dateElement.innerHTML = `${month}/${day}`;
    }, 1800000);
}

updateDate();


// 
// 
// 
// 
// 
// 


// Schedule class definition
class Schedule {
    constructor(scheduleString) {
        this.scheduleString = scheduleString;
        this.periods = this.parseSchedule();
    }
    
    parseSchedule() {
        const periods = [];
        const parts = this.scheduleString.split(',');
        
        for (let i = 0; i < parts.length; i++) {
            const periodData = parts[i].split(';');
            if (periodData.length >= 2) {
                const startTime = periodData[0];
                const name = periodData[1];
                const endTime = periodData.length > 2 ? periodData[2] : null;
                
                periods.push({
                    startTime,
                    name,
                    endTime
                });
            }
        }
        
        return periods;
    }
}

// Schedule data initialization
const schedule = [];

function initializeSchedules() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    switch (dayOfWeek) {
        case 1: // Monday
            schedule[0] = new Schedule(
                "7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50"
            );
            schedule[1] = new Schedule(
                "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"
            );
            break;
        case 2: // Tuesday
            schedule[0] = new Schedule(
                "7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;S.A.S.;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50"
            );
            schedule[1] = new Schedule(
                "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"
            );
            break;
        case 3: // Wednesday
            schedule[0] = new Schedule(
                "7:00;Good Morning!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;9:19,9:19;Passing Period;9:24,9:24;Period 2;10:58,10:58;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 3;13:11,13:11;Passing Period;13:16,13:16;Period 4;14:50"
            );
            schedule[1] = new Schedule(
                "10:58;Passing Period;11:03,11:03;Period 3;12:37,12:37;B Lunch;13:11"
            );
            break;
        case 4: // Thursday
            schedule[0] = new Schedule(
                "7:00;Good Morning!;7:30,7:30;Teacher PLC;8:05,8:05;Period 5;9:39,9:39;Homeroom;9:49,9:49;Eagle Time;10:56,10:56;A Lunch;11:32,11:32;Passing Period;11:37,11:37;Period 6;13:11,13:11;Passing Period;13:16,13:16;Period 7;14:50"
            );
            schedule[1] = new Schedule(
                "10:56;Passing Period;11:01,11:01;Period 6;12:35,12:35;B Lunch;13:11"
            );
            break;
        case 5: // Friday
            schedule[0] = new Schedule(
                "7:00;Happy Friday!;7:30,7:30;Teacher Office Hours;7:45,7:45;Period 1;8:36,8:36;Passing Period;8:41,8:41;Period 2;9:32,9:32;Passing Period;9:37,9:37;Period 3;10:28,10:28;Passing Period;10:33,10:33;Period 4;11:24,11:24;A Lunch;12:02,12:02;Passing Period;12:07,12:07;Period 5;12:58,12:58;Passing Period;13:03,13:03;Period 6;13:54,13:54;Passing Period;13:59,13:59;Period 7;14:50"
            );
            schedule[1] = new Schedule(
                "11:24;Passing Period;11:29,11:29;Period 5;12:20,12:20;B Lunch;12:58"
            );
            break;
        default:
            // Weekend - No schedule
            schedule[0] = null;
            schedule[1] = null;
    }
}

function getCurrentScheduleInfo() {
    // Get current day and time
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    // Make sure schedules are initialized
    if (schedule.length === 0) {
        initializeSchedules();
    }
    
    // Skip if weekend (no schedule)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return {
            inSession: false,
            message: "Weekend - No School",
            needsTwoProgressBars: false
        };
    }
    
    // Check if we have valid schedules
    if (!schedule[0]) {
        return {
            inSession: false,
            message: "No schedule available for today",
            needsTwoProgressBars: false
        };
    }
    
    // Check if we're currently in a period in schedule A (main schedule with A lunch)
    const scheduleAInfo = getCurrentPeriodInfo(schedule[0], currentTime);
    
    // Check if we're currently in a period in schedule B (alternative schedule with B lunch)
    const scheduleBInfo = getCurrentPeriodInfo(schedule[1], currentTime);
    
    // Determine if we need to display both bars
    const needsTwoProgressBars = scheduleBInfo.inSession;
    
    // Return complete information
    return {
        inSession: scheduleAInfo.inSession || scheduleBInfo.inSession,
        needsTwoProgressBars,
        scheduleA: scheduleAInfo,
        scheduleB: scheduleBInfo,
        currentTime: formatTime(now.getHours(), now.getMinutes()),
        nextPeriod: getNextPeriodInfo([schedule[0], schedule[1]], currentTime)
    };
}

function getCurrentPeriodInfo(scheduleObj, currentTimeInMinutes) {
    if (!scheduleObj) return { inSession: false };
    
    const now = new Date();
    const currentSeconds = now.getSeconds();
    const currentTimeInSeconds = (currentTimeInMinutes * 60) + currentSeconds;
    
    // Process each period in the schedule
    for (let i = 0; i < scheduleObj.periods.length; i++) {
        const period = scheduleObj.periods[i];
        
        // Skip entries without valid times
        if (!period.startTime || !period.endTime) continue;
        
        // Convert period times to minutes since midnight
        const startTimeMinutes = timeStringToMinutes(period.startTime);
        const endTimeMinutes = timeStringToMinutes(period.endTime);
        
        // Convert to seconds for more precise calculations
        const startTimeSeconds = startTimeMinutes * 60;
        const endTimeSeconds = endTimeMinutes * 60;
        
        // Check if current time falls within this period
        if (currentTimeInMinutes >= startTimeMinutes && currentTimeInMinutes < endTimeMinutes) {
            // Calculate progress and time remaining
            const totalDuration = endTimeMinutes - startTimeMinutes;
            const elapsed = currentTimeInMinutes - startTimeMinutes;
            const remaining = endTimeMinutes - currentTimeInMinutes;
            
            // More precise calculations including seconds
            const totalDurationSecs = endTimeSeconds - startTimeSeconds;
            const secondsElapsed = currentTimeInSeconds - startTimeSeconds;
            const secondsRemaining = endTimeSeconds - currentTimeInSeconds;
            const progressSeconds = (secondsElapsed / totalDurationSecs) * 100;
            
            // Calculate actual remaining minutes including decimal part for seconds conversion
            const remainingWithSeconds = remaining - (currentSeconds / 60);
            
            return {
                inSession: true,
                name: period.name,
                startTime: period.startTime,
                endTime: period.endTime,
                timeRemaining: formatRemainingTime(remainingWithSeconds),
                progress: progressSeconds.toFixed(1),
                remainingMinutes: remaining,
                remainingWithSeconds: remainingWithSeconds
            };
        }
    }
    
    // If we get here, we're not in any period
    return { inSession: false };
}

function getNextPeriodInfo(scheduleArray, currentTimeInMinutes) {
    const allPeriods = [];
    const now = new Date();
    const currentSeconds = now.getSeconds();
    
    // Collect all periods from both schedules
    for (const scheduleObj of scheduleArray) {
        if (!scheduleObj) continue;
        
        for (const period of scheduleObj.periods) {
            if (period.startTime && period.endTime) {
                const startTimeMinutes = timeStringToMinutes(period.startTime);
                // Only add if we don't already have this time/name combo
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
            // More precise calculation including seconds
            const timeUntilStart = period.startTimeMinutes - currentTimeInMinutes;
            // Adjust for seconds
            const timeUntilStartWithSeconds = timeUntilStart - (currentSeconds / 60);
            
            return {
                available: true,
                name: period.name,
                startTime: period.startTime,
                timeUntilStart: formatRemainingTime(timeUntilStartWithSeconds),
                minutesUntilStart: timeUntilStart,
                timeUntilStartWithSeconds: timeUntilStartWithSeconds
            };
        }
    }
    
    return { available: false, message: "No more periods today" };
}

// Helper function to convert time string (HH:MM) to minutes since midnight
function timeStringToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + (minutes || 0);
}

function timeStringToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + (seconds || 0);
}

// Helper function to format minutes as "X hr Y min"
function formatRemainingTime(minutes) {
    if (minutes < 1) {
        // Calculate remaining seconds
        const seconds = Math.floor(minutes * 60);
        return `${seconds} sec`;
    }
    
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hrs === 0) {
        return `${mins} min`;
    } else if (mins === 0) {
        return `${hrs} hr`;
    } else {
        return `${hrs} hr ${mins} min`;
    }
}

// Helper function to format hours and minutes as HH:MM
function formatTime(hours, minutes) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Function to update the schedule display on the page
function updateScheduleDisplay() {
    const scheduleInfo = getCurrentScheduleInfo();
    
    // Get elements for bar1 (A Lunch schedule)
    const bar1 = document.getElementById('bar1');
    const bar1Name = bar1.querySelector('.name');
    const bar1Remaining = bar1.querySelector('.remaining');
    const bar1Progress = bar1.querySelector('.progress');
    
    // Get elements for bar2 (B Lunch schedule)
    const bar2 = document.getElementById('bar2');
    const bar2Name = bar2.querySelector('.name');
    const bar2Remaining = bar2.querySelector('.remaining');
    const bar2Progress = bar2.querySelector('.progress');
    
    // Handle display of bar1 (always shown if any schedule is active)
    if (scheduleInfo.inSession) {
        // Get the info to display (either A schedule or next period if nothing active)
        const displayInfo = scheduleInfo.scheduleA.inSession ? scheduleInfo.scheduleA : 
                           (scheduleInfo.nextPeriod && scheduleInfo.nextPeriod.available ? 
                            { name: `Next: ${scheduleInfo.nextPeriod.name}`, timeRemaining: `in ${scheduleInfo.nextPeriod.timeUntilStart}` } : 
                            { name: "No more periods today", timeRemaining: "" });
        
        // Update bar1 display
        bar1Name.textContent = displayInfo.name;
        bar1Remaining.textContent = displayInfo.timeRemaining || "";
        
        // Update progress if in session
        if (scheduleInfo.scheduleA.inSession) {
            bar1Progress.style.width = `${scheduleInfo.scheduleA.progress}%`;
            bar1.classList.add('active');
        } else {
            bar1Progress.style.width = '0%';
            bar1.classList.remove('active');
        }
        
        bar1.style.display = 'flex';
    } else {
        // Nothing in session
        bar1.style.display = 'none';
    }
    
    // Handle display of bar2 (only shown during B lunch periods)
    if (scheduleInfo.needsTwoProgressBars && scheduleInfo.scheduleB.inSession) {
        bar2Name.textContent = scheduleInfo.scheduleB.name;
        bar2Remaining.textContent = scheduleInfo.scheduleB.timeRemaining;
        bar2Progress.style.width = `${scheduleInfo.scheduleB.progress}%`;
        bar2.classList.add('active');
        bar2.style.display = 'flex';
    } else {
        bar2.style.display = 'none';
    }
}

// Initialize and start
function initScheduleTracker() {
    // Initialize schedules based on current day
    initializeSchedules();
    
    // Start the schedule display updates
    updateScheduleDisplay();
    
    // Refresh schedules at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
        initializeSchedules();
        initScheduleTracker(); // Restart the whole process
    }, timeUntilMidnight);
}

// Start the schedule tracking
initScheduleTracker();

// For debugging: get current schedule info
function debugSchedule() {
    const info = getCurrentScheduleInfo();
    console.log('Current Schedule Information:', info);
    return info;
}

async function handleCommands() {
    const devLink = "https://script.google.com/macros/s/AKfycbxZe6A-GKnGcv9efNxrMeSNvxcYC2MhOvqQkQLNpIiQOqcJCSuCTauq0k7Pwuz4OIcf/exec";

    const response = await fetch(devLink); 
    const command = await response.text();

    if (command == "refresh") {
        location.reload();
    } else if (command == "wipe-storage") {
        localStorage.clear();
    }
}

handleCommands();