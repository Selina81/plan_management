const TASKS_API = 'http://127.0.0.1:5000/api/tasks';
const PLANS_API = 'http://127.0.0.1:5000/api/plans';

async function fetchTasks(planId) {
    if (!planId) {
        console.error('planId is not defined or invalid');
        return;
    }

    console.log('Fetching tasks for planId:', planId);
    fetch(`/api/tasks/${planId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch tasks');
            return response.json();
        })
        .then(tasks => {
            console.log('Fetched tasks:', tasks);
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}

async function fetchPlans() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/plans');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const plans = await response.json();
        displayPlans(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
    }
}


async function addTask(taskData) {
    try {
        const response = await fetch(TASKS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add task');
        }

        const data = await response.json();
        console.log('Task added successfully:', data);
        alert('Task added successfully!');
        fetchTasks(getPlanIdFromURL());
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task: ' + error.message);
    }
}

async function addPlan(planData) {
    try {
        await fetch(PLANS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData),
        });
        fetchPlans();
    } catch (error) {
        console.error('Error adding plan:', error);
    }
}

// Display tasks
async function displayTasks(planId) {
    fetch(`/api/tasks/${planId}`)
        .then(response => response.json())
        .then(tasks => {
            // Update task lists
            const taskContainer = document.getElementById('taskItems');
            const doneContainer = document.getElementById('doneTasks');
            taskContainer.innerHTML = '';
            doneContainer.innerHTML = '';

            console.log('Displaying tasks:', tasks);

            if (tasks.length === 0) {
                taskContainer.innerHTML = '<p>No tasks available for this plan.</p>';
            }

            tasks.forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.classList.add('task');
                taskDiv.innerHTML = `
                    <h4>${task.name}</h4>
                    <p>Due: ${task.due_date}</p>
                    <p>${task.description}</p>
                    <button onclick="markTaskAsDone(${task.id})">Mark as Done</button>
                `;
                if (task.completed) {
                    doneContainer.appendChild(taskDiv);
                } else {
                    taskContainer.appendChild(taskDiv);
                }
            });

            // Update calendar colors
            updateCalendarColors(tasks);
        });
}

// Display plans
function displayPlans(plans) {
    if (!Array.isArray(plans)) {
        console.error('Expected an array of plans but got:', plans);
        return;
    }

    const plansContainer = document.getElementById('plans-container');
    if (!plansContainer) {
        console.warn('Plans container not found.');
        return;
    }

    plansContainer.innerHTML = ''; // Clear any previous content

    plans.forEach(plan => {
        const planDiv = document.createElement('div');
        planDiv.classList.add('plan-item');
        planDiv.onclick = () => displayTasks(plan.id)
        planDiv.innerHTML = `
            <h4>${plan.title}</h4>
            <p>Status: ${plan.status}</p>
            <p>Start: ${plan.start_date}</p>
            <p>Due: ${plan.end_date}</p>
            <button class="mark-done" onclick="markPlanAsDone(${plan.id})">Mark Plan as Done</button>
        `;
        plansContainer.appendChild(planDiv);
    });
}

// Mark a task as done
async function markTaskAsDone(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/done`, {
            method: 'PUT'
        });
        if (response.ok) {
            alert('Task marked as done!');
            fetchTasks(); // Refresh the task list
        } else {
            const error = await response.json();
            console.error('Error:', error);
            alert('Failed to mark task as done: ' + error.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Mark a plan as done
async function markPlanAsDone(planId) {
    try {
        const response = await fetch(`/api/plans/${planId}/done`, {
            method: 'PUT'
        });
        if (response.ok) {
            alert('Plan marked as done!');
            fetchPlans(); // Refresh the plan list
        } else {
            const error = await response.json();
            console.error('Error:', error);
            alert('Failed to mark plan as done: ' + error.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function updateCalendarColors(tasks) {
    const calendarDates = document.querySelectorAll('.dates div'); // Adjust selector based on HTML
    calendarDates.forEach(date => date.style.backgroundColor = ''); // Reset colors

    tasks.forEach(task => {
        const dueDate = new Date(task.due_date);
        const day = dueDate.getDate();
        const targetDay = calendarDates[day - 1]; // Assuming days start from index 0
        if (targetDay) {
            targetDay.style.backgroundColor = 'lightblue'; // Highlight due dates
        }
    });
}

function getPlanIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('planId');
    return planId ? parseInt(planId, 10) : null;
}


document.addEventListener('DOMContentLoaded', function () {
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');

    const currentMonthLabel = document.getElementById('current-month');
    const calendarDatesContainer = document.getElementById('calendar-dates');

    const addTaskButton = document.getElementById('add-task-button');
    const addPlanButton = document.getElementById('add-plan-button');

    const planModal = document.getElementById('plan-modal');
    const taskModal = document.getElementById('task-modal');

    const addPlanSubmitButton = document.getElementById('add-plan-submit-button');

    const closeTaskModalButton = document.getElementById('close-task-modal');
    const closePlanModalButton = document.getElementById('close-plan-modal');

    const planForm = document.getElementById('plan-form');

    const taskButtons = document.querySelectorAll('.mark-done-task');
    const planButtons = document.querySelectorAll('.mark-done-plan');
   
    let currentDate = new Date();

    // Open Modals
    addTaskButton.addEventListener('click', () => {
        taskModal.classList.remove('hidden');
    });

     // Open the plan modal
    addPlanButton.addEventListener('click', () => {
        planModal.classList.remove('hidden');
    });

    // Close the plan modal
    closePlanModalButton.addEventListener('click', () => {
        planModal.classList.add('hidden');
    });

    // Close Modals
    closeTaskModalButton.addEventListener('click', () => {
        taskModal.classList.add('hidden');
    });    

    addPlanSubmitButton.addEventListener('click', () => {
        const title = document.getElementById('plan-title').value.value;
        const startDate = document.getElementById('plan-start-date').value;
        const endDate = document.getElementById('plan-end-date').value;
    
        if (!title) {
            alert('Plan title is required!');
            document.getElementById('plan-title').focus(); // Focus on the title input
            return;
        }
    
        if (!startDate) {
            alert('Start date is required!');
            document.getElementById('plan-start-date').focus(); // Focus on the start date input
            return;
        }
    
        if (!endDate) {
            alert('End date is required!');
            document.getElementById('plan-end-date').focus(); // Focus on the end date input
            return;
        }
    
        // Proceed to add the plan if validation passes
        addPlan({ title, start_date: startDate, end_date: endDate });
    
        // Close modal and reset form
        planModal.classList.add('hidden');
    });

    planForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const planData = {
            title: document.getElementById('plan-title').value,
            start_date: document.getElementById('plan-start-date').value,
            end_date: document.getElementById('plan-end-date').value,
        };
        await addPlan(planData);
        planModal.classList.add('hidden');
        planForm.reset();
    });

    // Add event listeners for task button
    taskButtons.forEach(button => {
        button.addEventListener('click', function() {
            const taskId = button.dataset.taskId;
            markTaskAsDone(taskId);
        });
    });

    // Add event listeners for plan button
    planButtons.forEach(button => {
        button.addEventListener('click', function() {
            const planId = button.dataset.planId;
            markPlanAsDone(planId);
        });
    });

    // Render Calendar
    function renderCalendar() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        // Update the current month label
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        currentMonthLabel.textContent = `${monthNames[month]} ${year}`;

        // Calculate the first and last day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Get the previous month's last days
        const prevMonthLastDay = new Date(year, month, 0);
        const prevDaysCount = firstDay.getDay();
        const prevDays = [];
        for (let i = prevMonthLastDay.getDate() - prevDaysCount + 1; i <= prevMonthLastDay.getDate(); i++) {
            prevDays.push(i);
        }

        // Get the current month's days
        const daysInMonth = [];
        for (let i = 1; i <= lastDay.getDate(); i++) {
            daysInMonth.push(new Date(year, month, i));
        }

        // Get the next month's first days
        const nextDaysCount = 7 - (lastDay.getDay() + 1);
        const nextDays = [];
        for (let i = 1; i <= nextDaysCount; i++) {
            nextDays.push(i);
        }

        // Generate calendar dates
        calendarDatesContainer.innerHTML = '';
        prevDays.forEach(day => {
            calendarDatesContainer.innerHTML += `<div class="date inactive">${day}</div>`;
        });
        daysInMonth.forEach(day => {
            calendarDatesContainer.innerHTML += `<div class="date active">${day.getDate()}</div>`;
        });
        nextDays.forEach(day => {
            calendarDatesContainer.innerHTML += `<div class="date inactive">${day}</div>`;
        });
    }
    // Initialize Calendar
    renderCalendar();

    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    fetchPlans();
});

document.addEventListener('DOMContentLoaded', () => {
    const planId = getPlanIdFromURL();

    if (planId) {
        console.log('Displaying tasks for planId:', planId);
        fetchTasks(planId);
    }

    document.querySelectorAll('.plan-item').forEach(planItem => {
        planItem.addEventListener('click', () => {
            const selectedPlanId = planItem.dataset.planId; // Giả định bạn đã thêm `data-plan-id` vào mỗi plan item

            if (selectedPlanId) {
                window.history.pushState({}, '', `?planId=${selectedPlanId}`);
                fetchTasks(selectedPlanId);

                // Cập nhật tiêu đề hoặc trạng thái để phản ánh Plan hiện tại
                document.getElementById('current-plan-title').textContent = `Current Plan ID: ${selectedPlanId}`;
            }
        });
    });
});


document.getElementById('add-task-submit-button').addEventListener('click', async (e) => {
    e.preventDefault();

    const planId = getPlanIdFromURL(); // Lấy plan_id từ URL
    if (!planId) {
        alert('Plan ID is missing or invalid!');
        console.error('Plan ID not found in URL.');
        return;
    }

    const taskData = {
        name: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim() || '',
        date_added: new Date().toISOString(),
        due_date: document.getElementById('task-due-date').value.trim(),
        plan_id: planId, // Gắn plan_id vào dữ liệu task
    };

    // Kiểm tra dữ liệu đầu vào
    if (!taskData.name || !taskData.due_date) {
        alert('Task name and due date are required!');
        console.error('Invalid task data:', taskData);
        return;
    }

    console.log('Submitting task:', taskData);
    await addTask(taskData);
});
