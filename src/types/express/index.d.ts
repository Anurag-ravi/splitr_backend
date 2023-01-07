// src/types/express/index.d.ts

import { IUserModel } from '../../models/user.model';
// to make the file a module and avoid the TypeScript error
export {};

declare global {
    namespace Express {
        export interface Request {
            user: IUserModel;
        }
    }
}
