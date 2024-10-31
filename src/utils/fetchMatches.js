export const fetchMatchesByIDs = async (matchIDsArray) => {
    if (!matchIDsArray.length) {
        console.warn("No matchIDs provided to fetch");
        return [];  // Return empty array if no matchIDs are provided
    }

    // Sanitize match IDs by replacing spaces with dashes
    const sanitizedMatchIDs = matchIDsArray.map(id => id.replace(/\s+/g, '-'));  // Replace spaces with dashes
    const matchIDs = sanitizedMatchIDs.join(',');  // Convert the array to a comma-separated string
    const url = `https://vexdb-production.up.railway.app/matches?matchIDs=${matchIDs}`;

    console.log("Fetching from URL:", url);  // Log the URL

    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',  // Explicitly set mode to cors
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error("Failed to fetch matches from backend");
        }
        const matchData = await response.json();
        return matchData;
    } catch (error) {
        console.error("Error fetching matches by IDs:", error);
        return [];  // Return an empty array in case of failure
    }
};
