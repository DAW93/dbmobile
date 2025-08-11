export type AnyUser = { role?: string };

export const isOwner = (u: AnyUser) => u?.role === 'owner';
export const isVip = (u: AnyUser) => u?.role === 'vip';
export const isCorporate = (u: AnyUser) => u?.role === 'corporate';
export const isFree = (u: AnyUser) => u?.role === 'free';

export const canPublish = (u: AnyUser) => isOwner(u) || isVip(u);
export const canAccessStore = (u: AnyUser) => !isCorporate(u);
