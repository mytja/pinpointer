export interface RoundResult {
	userId: string;
	username: string;
	scoreBefore: number;
	addedScore: number;
	newScore: number;
	distance: number;
	latLng: { lat: number; lng: number } | null;
}
