# sketchup-export.rb
# Paste this entire script into SketchUp's Ruby Console (Window > Ruby Console)
# with your model open. It writes model-export.json next to your .skp file.
#
# Works in any desktop SketchUp (2017 Make onward). Save your model first
# (the script needs the file path to know where to write).
#
# Output: one JSON array with two sections --
#   "definitions": each unique part with its TRUE local dimensions (inches)
#   "instances":   every placed copy with its tag, name, description, and position
#
# Dimensions are definition-local (the part's real size), not world-aligned
# bounding boxes, so rotated parts report their actual cut dimensions.

require 'json'

model = Sketchup.active_model
raise "Save the model first so I know where to write the JSON." if model.path.empty?

definitions = {}
instances = []

def collect(entities, path, depth, definitions, instances)
  return if depth > 12
  entities.each do |e|
    next unless e.is_a?(Sketchup::ComponentInstance) || e.is_a?(Sketchup::Group)
    defn = e.definition
    key = defn.name

    unless definitions.key?(key)
      b = defn.bounds
      definitions[key] = {
        "name"        => defn.name,
        "description" => (defn.description.to_s.strip.empty? ? nil : defn.description.strip),
        "dims_inches" => {
          "x" => b.width.to_f.round(4),
          "y" => b.height.to_f.round(4),
          "z" => b.depth.to_f.round(4)
        },
        "count" => 0
      }
      # Recurse into the definition ONCE (not per instance)
      collect(defn.entities, path + "/" + key, depth + 1, definitions, instances)
    end
    definitions[key]["count"] += 1

    o = e.transformation.origin
    instances << {
      "definition"    => key,
      "instance_name" => (e.name.to_s.strip.empty? ? nil : e.name.strip),
      "tag"           => e.layer.name,
      "parent_path"   => (path.empty? ? "(model root)" : path),
      "origin_inches" => [o.x.to_f.round(2), o.y.to_f.round(2), o.z.to_f.round(2)]
    }
  end
end

collect(model.active_entities, "", 0, definitions, instances)

out = {
  "model"       => File.basename(model.path),
  "exported_at" => Time.now.to_s,
  "units_note"  => "All dimensions and origins are INCHES. dims are definition-local (true part size). Origins are world coordinates of each instance.",
  "definitions" => definitions.values.sort_by { |d| d["name"].downcase },
  "instances"   => instances
}

out_path = File.join(File.dirname(model.path), "model-export.json")
File.write(out_path, JSON.pretty_generate(out))
puts "Wrote #{out_path}"
puts "#{definitions.size} unique definitions, #{instances.size} placed instances."
puts "Tip: anything named 'Group' or 'Component#N' wasn't semantically named -- consider naming it in the model and re-running."
