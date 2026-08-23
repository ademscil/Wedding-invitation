export default function InvitationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * Entrance animations slide content in from off-screen and the cover's
     * pulse ring scales past its box. Without clipping the horizontal axis
     * here, each of those briefly widens the document and the guest gets a
     * sideways scrollbar mid-animation.
     *
     * `clip` rather than `hidden`: it prevents the overflow without turning
     * this into a scroll container, so `position: sticky` inside the templates
     * keeps working.
     */
    <div className="overflow-x-clip">{children}</div>
  );
}
