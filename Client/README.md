# Train-Titan
Project Overview
This project focuses on developing a state-of-the-art Fitness Tracker platform using the MERN stack (MongoDB, Express.js, React.js, Node.js). This platform will empower users to track their fitness progress, set personalized goals, and connect with a dynamic fitness community.

# Live Demo 🌐
Live Demo Link

## Purpose
The purpose of this project is to create an innovative fitness tracker platform that helps users monitor their health, set goals, and stay motivated, while fostering a supportive and interactive fitness community. The platform aims to empower individuals to lead healthier, more active lives through technology-driven solutions.

#### This project serves as a learning platform to implement various full-stack development techniques including database interaction, form handling, and role based user authentication.

# Key Features
## Admin Features

The __Admin__ has full control over user management, financials, and class creation:

## 1. Newsletter Subscribers
- View all newsletter subscribers in a table.
## 2. All Trainers
- View and manage trainers.
- __Delete Trainer__: Revert a trainer to a regular member.
## 3. Applied Trainers
- View trainer applications.
- __Confirm__: Approve and convert an applicant to a trainer.
- __Reject__: Remove an applicant from the list.
## 4. Balance Overview
- View __Total Balance__ and the last six booking transactions.
- Visualize __Total Subscribers__ vs Paid Members with charts.
## 5. Add New Class
- Add new classes with a form that includes class name, image, details, and more.
### Trainer Features

The __Trainer__ has access to manage slots and forums, and view their schedule:

## 1. Manage Slots
- View all available slots in a table.
- If a slot is booked, see details about the booking and who reserved the slot.
- __Delete Slot__: Delete a slot with a confirmation prompt.
## 2. Add New Slot
- Fill out a form to add new slots with:
- __Slot Name__ (e.g., morning slot)
- __Slot Time__ (e.g., 1 hour)
- __Classes__ (Select from classes added by the Admin)
## 3. Add New Forum
- Trainers can add new forums to the __Community/Forums__ page.
- Admin and Trainer have the same permissions for adding and viewing forums.
## Member Features

- The __Member__ has access to their personal details, application status, and trainer bookings:

## 1. Activity Log
- View the status of trainer applications (e.g., __Pending, Rejected__).
- __Eye Icon__: Click to view rejection feedback in a modal.
- Once approved, the member’s role will change to __Trainer__, and they will no longer have access to this page.
## 2. Profile Page
- Manage account details, including:
- __Name__
- __Profile Picture__
- __Email (cannot be edited)__
- __Last Login Status__
- __Edit other personal information.__
## 3. Booked Trainer
- View details about the trainer and their classes:
- __Trainer Info__
- __Classes Info__
- __Slot Info__
### Review Button: Provide feedback via a modal with:
- __Textarea__ for written feedback
- __Star Rating__ system
- Submit reviews, which are stored and displayed in the __Testimonials__ section.
# Technologies & Concepts Used
## Frontend Concepts
- __React.js__: Component-based UI development.
- __React Router__: For dynamic routing and private route protection.
- __Responsive Design__: Ensuring cross-device compatibility.
- __React Toastify and Others npm packages__: User-friendly notifications and apply many npm packages.
- __Environment Variables__: Secure Firebase & authentication keys.
- __CSS Frameworks__: Tailwind CSS for consistent styling.
## Backend Concepts
- __Node.js__: Server-side runtime environment.
- __Express.js__: Backend framework for routing and middleware.
- __MongoDB__: Database for storing user data.
- __JWT Authentication__: Secure token-based route protection.
- __Environment Variables__: Secure MongoDB credentials.
## Additional Concepts
- Real-time updates with MongoDB's $inc operator and many more operators.
- Modular code structure with meaningful commits.
- Deployment to production-grade environments.
## Here are some common npm packages that have been utilized in the project.
- __react-router-dom__: Routing in React.
- __react-toastify__: Toast notifications.
- __react-rating-stars-component__: Review rating functionality.
- __dotenv__: Secure environment variable management.
- __jsonwebtoken__: Token-based authentication.
- __express__: Backend framework.
- __mongoose__: MongoDB object modeling.
- __cors__: Handling cross-origin requests.
# ⚙️ Installation and Setup
To get started with the project, follow these steps:

1. Clone the repository:

> git clone https://github.com/Maheswari-246/Personalized

cd Train-Titan

2. Install dependencies:

> npm install

3. Start the development server:

> npm run dev

