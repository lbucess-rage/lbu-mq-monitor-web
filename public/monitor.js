let socket;
let eventFilter = 'all';
let stationEvents = [];
let agentEvents = [];
let connectedTime = null;
let autoScroll = true;

const MAX_EVENTS = 100;

function initializeSocket() {
    const host = window.location.hostname;
    const port = window.location.port || 5002;

    socket = io(`http://${host}:${port}/events`, {
        transports: ['websocket'],
        upgrade: false
    });

    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
        connectedTime = new Date();
        updateConnectedTime();
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
        connectedTime = null;
    });

    socket.on('connected', (data) => {
        console.log('Connection confirmed:', data);
    });

    // Only listen to mqEvent to avoid duplicates
    socket.on('mqEvent', (event) => {
        if (eventFilter === 'all' ||
            (eventFilter === 'station' && event.type === 'StationEvent') ||
            (eventFilter === 'agent' && event.type === 'AgentStatus')) {
            handleNewEvent(event);
        }
    });

    // Comment out individual event listeners to prevent duplicates
    // socket.on('stationEvent', (event) => {
    //     if (eventFilter === 'all' || eventFilter === 'station') {
    //         addStationEvent(event);
    //     }
    // });

    // socket.on('agentStatus', (event) => {
    //     if (eventFilter === 'all' || eventFilter === 'agent') {
    //         addAgentEvent(event);
    //     }
    // });

    socket.on('history', (events) => {
        console.log(`Received ${events.length} historical events`);
        events.forEach(event => {
            if (event.type === 'StationEvent') {
                addStationEvent(event, false);
            } else if (event.type === 'AgentStatus') {
                addAgentEvent(event, false);
            }
        });
        updateEventCounts();
    });

    socket.on('status', (data) => {
        console.log('Server status:', data.data);
    });

    socket.emit('getStatus');
}

function handleNewEvent(event) {
    if (event.type === 'StationEvent') {
        addStationEvent(event);
    } else if (event.type === 'AgentStatus') {
        addAgentEvent(event);
    }
}

function addStationEvent(event, animate = true) {
    stationEvents.unshift(event);

    if (stationEvents.length > MAX_EVENTS) {
        stationEvents = stationEvents.slice(0, MAX_EVENTS);
    }

    const container = document.getElementById('stationEvents');

    if (stationEvents.length === 1) {
        container.innerHTML = '';
    }

    const eventElement = createEventElement(event, 'station');

    if (animate) {
        container.insertBefore(eventElement, container.firstChild);
    } else {
        container.appendChild(eventElement);
    }

    while (container.children.length > MAX_EVENTS) {
        container.removeChild(container.lastChild);
    }

    document.getElementById('stationCount').textContent = stationEvents.length;
    document.getElementById('stationLastUpdate').textContent = formatTime(new Date());
    updateTotalEvents();

    if (autoScroll && animate) {
        container.scrollTop = 0;
    }
}

function addAgentEvent(event, animate = true) {
    agentEvents.unshift(event);

    if (agentEvents.length > MAX_EVENTS) {
        agentEvents = agentEvents.slice(0, MAX_EVENTS);
    }

    const container = document.getElementById('agentEvents');

    if (agentEvents.length === 1) {
        container.innerHTML = '';
    }

    const eventElement = createEventElement(event, 'agent');

    if (animate) {
        container.insertBefore(eventElement, container.firstChild);
    } else {
        container.appendChild(eventElement);
    }

    while (container.children.length > MAX_EVENTS) {
        container.removeChild(container.lastChild);
    }

    document.getElementById('agentCount').textContent = agentEvents.length;
    document.getElementById('agentLastUpdate').textContent = formatTime(new Date());
    updateTotalEvents();

    if (autoScroll && animate) {
        container.scrollTop = 0;
    }
}

function createEventElement(event, type) {
    const div = document.createElement('div');
    div.className = `event-item ${type}`;

    const timestamp = new Date(event.timestamp);

    let messagePreview = event.message;
    try {
        const parsed = JSON.parse(event.message);
        messagePreview = JSON.stringify(parsed, null, 2);
    } catch (e) {
        // Keep original message if not JSON
    }

    div.innerHTML = `
        <div class="event-time">${formatDateTime(timestamp)}</div>
        <div class="event-topic">${event.topic}</div>
        <div class="event-message">${escapeHtml(messagePreview)}</div>
    `;

    div.onclick = () => showEventDetails(event);

    return div;
}

function showEventDetails(event) {
    let formattedMessage = event.message;
    try {
        const parsed = JSON.parse(event.message);
        formattedMessage = JSON.stringify(parsed, null, 2);
    } catch (e) {
        // Keep original message if not JSON
    }

    alert(`Event Details:\n\nType: ${event.type}\nTopic: ${event.topic}\nTimestamp: ${new Date(event.timestamp).toLocaleString()}\n\nMessage:\n${formattedMessage}`);
}

function updateConnectionStatus(connected) {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('connectionText');

    if (connected) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'Connected';
    } else {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'Disconnected';
    }
}

function updateConnectedTime() {
    const element = document.getElementById('connectedTime');

    if (!connectedTime) {
        element.textContent = '-';
        return;
    }

    const updateTime = () => {
        if (!connectedTime) return;

        const now = new Date();
        const diff = Math.floor((now - connectedTime) / 1000);

        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        let timeString = '';
        if (hours > 0) {
            timeString = `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            timeString = `${minutes}m ${seconds}s`;
        } else {
            timeString = `${seconds}s`;
        }

        element.textContent = timeString;
    };

    updateTime();
    setInterval(updateTime, 1000);
}

function updateTotalEvents() {
    const total = stationEvents.length + agentEvents.length;
    document.getElementById('totalEvents').textContent = total;
}

function updateEventCounts() {
    document.getElementById('stationCount').textContent = stationEvents.length;
    document.getElementById('agentCount').textContent = agentEvents.length;
    updateTotalEvents();
}

function setFilter(filter) {
    eventFilter = filter;

    document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains('btn-primary')) {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        }
    });

    let activeBtn;
    switch(filter) {
        case 'all':
            activeBtn = document.getElementById('filterAll');
            break;
        case 'station':
            activeBtn = document.getElementById('filterStation');
            break;
        case 'agent':
            activeBtn = document.getElementById('filterAgent');
            break;
    }

    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.classList.remove('btn-secondary');
        activeBtn.classList.add('btn-primary');
    }
}

function clearEvents() {
    if (confirm('Are you sure you want to clear all events?')) {
        stationEvents = [];
        agentEvents = [];

        document.getElementById('stationEvents').innerHTML = '<div class="empty-state">No station events yet</div>';
        document.getElementById('agentEvents').innerHTML = '<div class="empty-state">No agent status events yet</div>';

        updateEventCounts();

        document.getElementById('stationLastUpdate').textContent = '-';
        document.getElementById('agentLastUpdate').textContent = '-';

        if (socket && socket.connected) {
            socket.emit('clearHistory');
        }
    }
}

function toggleAutoScroll() {
    autoScroll = !autoScroll;
    document.getElementById('autoScrollStatus').textContent = autoScroll ? 'ON' : 'OFF';
}

function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('MQ Event Monitor starting...');
    initializeSocket();
});