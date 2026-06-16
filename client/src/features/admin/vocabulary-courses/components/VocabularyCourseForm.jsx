import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  order: z.coerce.number().min(0),
  isPublished: z.boolean(),
});

export const defaultVocabularyCourseValues = {
  title: "",
  description: "",
  thumbnailUrl: "",
  level: "beginner",
  order: 0,
  isPublished: false,
};

export default function VocabularyCourseForm({
  defaultValues = defaultVocabularyCourseValues,
  isSubmitting,
  onSubmit,
  submitLabel,
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues,
    resolver: zodResolver(courseSchema),
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-bold text-coal" htmlFor="title">
          Title
        </label>
        <input
          className="h-11 w-full rounded-lg border border-coal/20 bg-white/80 px-4 text-sm outline-none focus:border-coal"
          id="title"
          {...register("title")}
        />
        {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-coal" htmlFor="description">
          Description
        </label>
        <textarea
          className="min-h-28 w-full rounded-lg border border-coal/20 bg-white/80 px-4 py-3 text-sm outline-none focus:border-coal"
          id="description"
          {...register("description")}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-coal" htmlFor="thumbnailUrl">
          Thumbnail URL
        </label>
        <input
          className="h-11 w-full rounded-lg border border-coal/20 bg-white/80 px-4 text-sm outline-none focus:border-coal"
          id="thumbnailUrl"
          {...register("thumbnailUrl")}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-bold text-coal" htmlFor="level">
            Level
          </label>
          <select
            className="h-11 w-full rounded-lg border border-coal/20 bg-white/80 px-4 text-sm outline-none focus:border-coal"
            id="level"
            {...register("level")}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-coal" htmlFor="order">
            Order
          </label>
          <input
            className="h-11 w-full rounded-lg border border-coal/20 bg-white/80 px-4 text-sm outline-none focus:border-coal"
            id="order"
            min="0"
            type="number"
            {...register("order")}
          />
        </div>

        <label className="flex items-end gap-3 pb-3 text-sm font-bold text-coal">
          <input className="h-4 w-4 accent-coal" type="checkbox" {...register("isPublished")} />
          Published
        </label>
      </div>

      <button
        className="rounded-lg bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
