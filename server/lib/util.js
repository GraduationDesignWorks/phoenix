const formatedUserInfo = ({
  user,
  followings = [],
  followers = [],
  following = false,
}) => {
  const {
    account,
    name,
    avatar,
  } = user
  return {
    account,
    name,
    avatar,
    following,
    followings,
    followers,
  }
}

export {
  formatedUserInfo,
}