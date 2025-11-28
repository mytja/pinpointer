export interface RoundResult {
	userId: string;
	username: string;
	scoreBefore: number;
	addedScore: number;
	newScore: number;
	distance: number;
	municipality: string;
	latLng: { lat: number; lng: number } | null;
}
