import { v4 as uuidv4 } from 'uuid';
const generateOrderNumber = (): string => {
     const uniqueId = uuidv4().split('-')[0];
     return `#${uniqueId}`;
};

export default generateOrderNumber;
