import { createAppController } from './app/controller.js';
import { clients, listings, tasks } from './data/fixtures.js';

const root = document.querySelector('#app');
createAppController(root, { clients, listings, tasks });
