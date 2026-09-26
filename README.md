# Team Project Management System

A backend API for organizing projects, breaking them into tasks, assigning tasks to team members, and tracking progress

## Project Overview

The system has three core entities:

- **Users** — create an account, log in, manage a profile.
- **Projects** — created and owned by a user, with other users added as members.
- **Tasks** — belong to a project, can be assigned to a project member, and have a status (`To Do` → `In progress` → `Done`) and priority (`Low` → `Medium` → `High`).

Access control is role-based with two roles, scoped per project:

- **Owner** — the user who created the project. Can edit/delete the project, add/remove members, and edit or delete any task in it.
- **Member** — a user added to a project. Can view the project and its tasks, and update the status of tasks assigned to them, but cannot edit the project, delete tasks, or edit fields other than status on a task.

## Technologies Used

- **Node.js / Express** — server and routing
- **MongoDB / Mongoose** — database and schema modeling
- **JWT (jsonwebtoken)** — authentication, stored in an httpOnly cookie
- **bcryptjs** — password hashing
- **validator** — email format validation
- **dotenv** — environment variable loading (local development)
- Deployed on **Vercel**

## Setup Instructions

### Prerequisites

- Node.js (v18+ recommended)
- A MongoDB database (local, or a free MongoDB Atlas cluster)

### Installation

```bash
git clone https://github.com/Mariam-Sameh17/Team-Project-Management-System.git
cd Team-Project-Management-System
npm install
```

### Environment Variables

Create a `config.env` file in the project root :

```
DATABASE=< MongoDB connection string>
JWT_SECRET=<SECRET PASSWORD>
JWT_EXPIRES_IN=90d
COOKIE_EXPIRES_IN=90
```

`DATABASE` should be a full MongoDB connection string, e.g. `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority`. If using Atlas, make sure the cluster's Network Access allows connections from `0.0.0.0/0` (required for serverless deployments where the calling IP isn't fixed).

### Running Locally

```bash
npm start
```

The server runs on port 3000 by default. Test endpoints with Postman, Insomnia, or similar, pointed at `http://localhost:3000`.

### Database Setup

No manual migration is required — Mongoose creates collections and indexes automatically on first write, based on the schemas in `/models`. To reset test data during development, drop the relevant collection(s) directly in MongoDB Compass or `mongosh`.

## Deployment

Live API base URL: `https://team-project-management-system-fawn.vercel.app`

Deployed on Vercel, connected to the `main` branch on GitHub for automatic deployments on push. Environment variables are configured directly in the Vercel dashboard (Project → Settings → Environment Variables), not via a committed file.

## Database Design

### User

| Field         | Type   | Notes                                                         |
| ------------- | ------ | ------------------------------------------------------------- |
| `userName`    | String | required, unique, letters/numbers/`_`/`.` only                |
| `email`       | String | required, unique, validated format, lowercased                |
| `phone`       | String | required, exactly 11 digits                                   |
| `password`    | String | required, hashed with bcrypt before save                      |
| `passConfirm` | String | required on signup, validated to match `password`, not stored |

### Project

| Field                     | Type                   | Notes                      |
| ------------------------- | ---------------------- | -------------------------- |
| `name`                    | String                 | required, unique           |
| `description`             | String                 | optional                   |
| `owner`                   | ObjectId (ref: User)   | the creator                |
| `members`                 | [ObjectId] (ref: User) | users added to the project |
| `createdAt` / `updatedAt` | Date                   | automatic timestamps       |

### Task

| Field                     | Type                    | Notes                                                                                |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `title`                   | String                  | required, unique **within the same project** (compound index on `project` + `title`) |
| `description`             | String                  | optional                                                                             |
| `status`                  | String (enum)           | `To Do` / `In progress` / `Done`, default `To Do`                                    |
| `priority`                | String (enum)           | `Low` / `Medium` / `High`, default `Medium`                                          |
| `project`                 | ObjectId (ref: Project) | required                                                                             |
| `assignedTo`              | ObjectId (ref: User)    | must be the project's owner or a member (enforced in the controller, not the schema) |
| `createdAt` / `updatedAt` | Date                    | automatic timestamps                                                                 |

**Relationships:** referencing is used throughout rather than embedding, since Users, Projects, and Tasks are each queried independently and a project's task list can grow without a fixed bound.

## API Documentation / Endpoints

All endpoints except signup/login require authentication via a `jwt` httpOnly cookie, set on login. Protected routes use the `protect` middleware; project/task routes additionally use `ownerRestriction` (owner-only) or `memberRestriction` (owner or member) as noted.

### Auth — `/api/users`

| Method | Endpoint      | Access        | Description                                                   |
| ------ | ------------- | ------------- | ------------------------------------------------------------- |
| POST   | `/signup`     | Public        | Create an account                                             |
| POST   | `/login`      | Public        | Log in with `userName`/`email` + password, returns JWT cookie |
| GET    | `/logout`     | Authenticated | Clear the JWT cookie                                          |
| GET    | `/profile`    | Authenticated | Get own profile, owned projects, and assigned tasks           |
| GET    | `/find?name=` | Authenticated | Search users by username (for adding as members)              |

### Projects — `/api/projects`

| Method | Endpoint                         | Access          | Description                                                                     |
| ------ | -------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| POST   | `/create`                        | Authenticated   | Create a project (creator becomes owner)                                        |
| GET    | `/find?name=&page=&limit=&sort=` | Authenticated   | List projects the user owns or is a member of; filter, paginate, sort           |
| GET    | `/findOne/:id`                   | Owner or Member | Get one project, populated with owner/members, plus task-status progress counts |
| PATCH  | `/update/:id`                    | Owner only      | Update name/description                                                         |
| DELETE | `/delete/:id`                    | Owner only      | Delete the project and all its tasks                                            |
| PATCH  | `/:id/addMember`                 | Owner only      | Add a user (by `userId` in body) as a member                                    |
| PATCH  | `/:id/removeMember`              | Owner only      | Remove a member (by `userId` in body); unassigns their tasks in this project    |

### Tasks — `/api/projects/:projectId/tasks`

| Method | Endpoint                                            | Access          | Description                                                               |
| ------ | --------------------------------------------------- | --------------- | ------------------------------------------------------------------------- |
| POST   | `/create`                                           | Owner only      | Create a task in this project                                             |
| GET    | `/find?title=&status=&priority=&page=&limit=&sort=` | Owner or Member | List tasks; filter, paginate, sort                                        |
| GET    | `/findOne/:taskId`                                  | Owner or Member | Get one task                                                              |
| PATCH  | `/update/:taskId`                                   | Owner or Member | Owner may edit any task; a member may only update a task assigned to them |
| DELETE | `/delete/:taskId`                                   | Owner only      | Delete a task                                                             |
| PATCH  | `/assign/:taskId`                                   | Owner only      | Assign to a user (must be the project's owner or a member)                |
| PATCH  | `/unassign/:taskId`                                 | Owner only      | Clear a task's assignee                                                   |

### Response shape

Success:

```json
{ "status": "success", "data": { "...": "..." } }
```

List endpoints also include `results` (count on this page) and `pagination`:

```json
{ "page": 1, "limit": 10, "total": 42, "pages": 5 }
```

Failure:

```json
{ "status": "fail", "message": "...", "source": "controllerName" }
```

## Assumptions & Additional Features

- Login accepts either a username or an email in one `identifier` field, distinguished by the presence of `@`.
- Project and task names/titles are matched case-insensitively for search (`$regex` with the `i` option), but stored as-typed.
- Task titles are unique within a project (not globally), enforced with a compound MongoDB index.
- Removing a member from a project automatically unassigns any tasks currently assigned to them in that project, rather than leaving a dangling reference.
- Deleting a project cascades to delete all of its tasks.
- A generic 404 is returned for a project a user has no access to (rather than 403), so a user can't tell whether a project exists at all if they aren't a member of it.
