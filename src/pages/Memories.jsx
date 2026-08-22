import PageHeader from "../components/PageHeader.jsx";

// Automatically picks up every image placed in src/assets/memories/
// Just drop files there named img1.jpg, img2.jpg, img3.png, etc. —
// no code changes needed, they'll show up here on their own.
const imageModules = import.meta.glob(
  "../assets/memories/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    import: "default",
  },
);

// Sort "naturally" so img2 comes before img10 (not alphabetically as img10, img2).
const photos = Object.entries(imageModules)
  .sort(([pathA], [pathB]) =>
    pathA.localeCompare(pathB, undefined, { numeric: true }),
  )
  .map(([path, src]) => ({ path, src }));

function Memories() {
  return (
    <div>
      <PageHeader
        icon="📸"
        title="Memories"
        description="A little gallery for our favorite photos and moments."
      />

      {photos.length === 0 ? (
        <div className="keepsake-card p-10 text-center text-plum-400 text-sm dark:text-blush-200/80">
          No photos yet — drop images into{" "}
          <code className="text-rose-500 dark:text-rose-300">
            src/assets/memories
          </code>
          , named img1, img2, img3 (and so on), and they'll show up here
          automatically.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.path}
              className="keepsake-card aspect-square overflow-hidden p-0"
            >
              <img
                src={photo.src}
                alt="A memory of us"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Memories;
