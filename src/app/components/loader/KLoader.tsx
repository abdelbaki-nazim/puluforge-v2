import { Loader } from "@progress/kendo-react-indicators";

export default function KLoader() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Loader type={"converging-spinner"} />
    </div>
  );
}
