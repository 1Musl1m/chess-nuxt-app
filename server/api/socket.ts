import { defineEventHandler } from 'h3';
import { initSocket } from '../socket';

export default defineEventHandler((event) => {
  initSocket(event);
  return 'Socket initialized';
});