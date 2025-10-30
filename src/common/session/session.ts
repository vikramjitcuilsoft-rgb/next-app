export interface UserInfo {
    _id?: string
    id?: string
    username?: string
    email?: string
    profilePicture?: string
    user_avatar_url?: string
    firstName?: string
    lastName?: string
    phone?: string
    bio?: string
    role?: string
    createdAt?: string
    updatedAt?: string
    __v?: number
}

export const getUserInfo = (): UserInfo | null => {
    const userInfo = localStorage.getItem('user')
    if (!userInfo) return null
    try {
        return JSON.parse(userInfo)
    } catch (error) {
        console.error('Error parsing user info:', error)
        return null
    }
}

export const saveUserInfo = (userInfo: UserInfo): void => {
    try {
        localStorage.setItem('user', JSON.stringify(userInfo))
    } catch (error) {
        console.error('Error saving user info:', error)
    }
}

export const getAuthToken = (): string | null => {
    return localStorage.getItem('token')
}