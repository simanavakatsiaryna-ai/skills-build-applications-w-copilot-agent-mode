import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const badRequest = (message: string) => Object.assign(new Error(message), { status: 400 });
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw badRequest('Activity input must be an object');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const isObjectId = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) && mongoose.Types.ObjectId.isValid(value);
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw badRequest('userId and teamId must be valid IDs');
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw badRequest('type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('minutes must be a positive number');
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) {
    throw badRequest('userId and teamId must reference existing records');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const badRequest = (message: string) => Object.assign(new Error(message), { status: 400 });
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw badRequest('Team input must be an object');
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) {
    throw badRequest('name is required');
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw badRequest('mascot is required');
  }
  if (!Array.isArray(members)) {
    throw badRequest('members must be an array of user IDs');
  }
  const memberIds = members.map((member) => {
    if (typeof member !== 'string' || !/^[a-f\d]{24}$/i.test(member) || !mongoose.Types.ObjectId.isValid(member)) {
      throw badRequest('members must contain valid user IDs');
    }
    return member;
  });
  if (memberIds.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: memberIds } });
    if (memberCount !== new Set(memberIds).size) {
      throw badRequest('members must reference existing users');
    }
  }

  const team = await Team.create({ name, mascot, members: memberIds });
  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ _id: mongoose.Types.ObjectId; name: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        let: { teamId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$team', '$$teamId'] } } },
          { $group: { _id: null, totalPoints: { $sum: '$points' } } },
        ],
        as: 'activityTotals',
      },
    },
    {
      $project: {
        name: 1,
        totalPoints: { $ifNull: [{ $arrayElemAt: ['$activityTotals.totalPoints', 0] }, 0] },
      },
    },
    { $sort: { totalPoints: -1, name: 1 } },
  ]);
  return teams.map((team, index) => ({
    teamName: team.name,
    totalPoints: team.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [recentActivity] = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(1)
    .lean();
  const workouts = await Workout.find().lean();
  const goal = user.fitnessGoal.trim().toLowerCase();
  const activityType = recentActivity?.type.trim().toLowerCase();
  const focusByActivity: Record<string, string> = {
    run: 'endurance',
    running: 'endurance',
    cycle: 'endurance',
    cycling: 'endurance',
    walk: 'endurance',
    strength: 'strength',
  };
  const activityFocus = activityType ? focusByActivity[activityType] ?? activityType : undefined;

  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const matchesGoal = focus === goal;
      const matchesActivity = Boolean(activityFocus && focus === activityFocus);
      const reason = matchesGoal
        ? `This workout matches your ${user.fitnessGoal} fitness goal.`
        : matchesActivity
          ? `This workout matches your recent ${recentActivity?.type} activity.`
          : 'This workout is available as another training option.';
      return { ...workout, reason, relevance: matchesGoal ? 2 : matchesActivity ? 1 : 0 };
    })
    .sort((left, right) => right.relevance - left.relevance)
    .map(({ relevance: _relevance, ...workout }) => workout);
}

export { User };
