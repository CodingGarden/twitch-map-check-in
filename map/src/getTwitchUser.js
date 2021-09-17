export default async function getTwitchUser(userId) {
  try {
    const response = await fetch(`https://api.twitch.tv/kraken/users/${userId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json',
        'Client-ID': 'gp762nuuoqcoxypju8c569th9wz7q5',
      }
    });
    if (response.ok) {
      return response.json();
    }
    return null;
  } catch (error) {
    return null;    
  }
}