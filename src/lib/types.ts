export interface TutorialStep {
	title: string;
	description: string;
	tools?: string[];
	caution?: string;
	image?: string;
}

export interface RepairGuide {
	title: string;
	safety?: string;
	steps: TutorialStep[];
}

export interface GenerateGuideParams {
	description: string;
	imageFile?: File;
	onStatus?: (message: string) => void;
}
