import { Request, Response } from 'express';
import * as UserService from './user.service';

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

