import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  word: z.string().trim().min(1, "Word is required"),
  phonetic: z.string().optional(),
  partOfSpeech: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "preposition",
    "conjunction",
    "phrase",
    "other",
  ]),
  meaningVi: z.string().trim().min(1, "Vietnamese meaning is required"),
  meaningEn: z.string().optional(),
  example: z.string().optional(),
  exampleMeaningVi: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  order: z.coerce.number().min(0),
  difficulty: z.enum(["easy", "medium", "hard"]),
  isPublished: z.boolean(),
});

export const defaultVocabularyItemValues = {
  word: "",
  phonetic: "",
  partOfSpeech: "other",
  meaningVi: "",
  meaningEn: "",
  example: "",
  exampleMeaningVi: "",
  imageUrl: "",
  audioUrl: "",
  order: 0,
  difficulty: "easy",
  isPublished: true,
};

export default function VocabularyItemForm({ defaultValues, isSubmitting, onSubmit, submitLabel }) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm({
    defaultValues: defaultValues || defaultVocabularyItemValues,
    resolver: zodResolver(schema),
  });
  const audioUrl = watch("audioUrl");

  useEffect(() => {
    reset(defaultValues || defaultVocabularyItemValues);
  }, [defaultValues, reset]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field error={errors.word?.message} label="Word">
          <input className={inputClass} {...register("word")} />
        </Field>
        <Field label="Phonetic">
          <input className={inputClass} {...register("phonetic")} />
        </Field>
        <Field label="Part of speech">
          <select className={inputClass} {...register("partOfSpeech")}>
            {["noun", "verb", "adjective", "adverb", "preposition", "conjunction", "phrase", "other"].map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
        </Field>
        <Field label="Difficulty">
          <select className={inputClass} {...register("difficulty")}>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </Field>
      </div>

      <Field error={errors.meaningVi?.message} label="Meaning VI">
        <input className={inputClass} {...register("meaningVi")} />
      </Field>
      <Field label="Meaning EN">
        <input className={inputClass} {...register("meaningEn")} />
      </Field>
      <Field label="Example">
        <input className={inputClass} {...register("example")} />
      </Field>
      <Field label="Example meaning VI">
        <input className={inputClass} {...register("exampleMeaningVi")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Image URL">
          <input className={inputClass} {...register("imageUrl")} />
        </Field>
        <Field label="Audio URL">
          <input className={inputClass} {...register("audioUrl")} />
        </Field>
      </div>
      {audioUrl ? <audio className="w-full" controls src={audioUrl} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Order">
          <input className={inputClass} min="0" type="number" {...register("order")} />
        </Field>
        <label className="flex items-end gap-3 pb-3 text-sm font-bold">
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

const inputClass =
  "h-11 w-full rounded-lg border border-coal/20 bg-white/80 px-4 text-sm outline-none focus:border-coal";

function Field({ children, error, label }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
