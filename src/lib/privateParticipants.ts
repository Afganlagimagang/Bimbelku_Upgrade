export type PrivateParticipantDetail = {
  full_name: string;
  nickname: string;
  birth_date: string;
  gender: "male" | "female" | "";
};

export const emptyParticipantDetail = (): PrivateParticipantDetail => ({
  full_name: "",
  nickname: "",
  birth_date: "",
  gender: "",
});
