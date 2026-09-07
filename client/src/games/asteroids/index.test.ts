import { describe, expect, it } from "vitest";
import { spawnRock } from "./index";

describe("asteroids spawner", () => {
  it("keeps new rocks far from the ship", () => {
    for (let i = 0; i < 30; i += 1) {
      const rock = spawnRock(1, 50, 50, 3);
      const dx = Math.min(Math.abs(rock.x - 50), 100 - Math.abs(rock.x - 50));
      const dy = Math.min(Math.abs(rock.y - 50), 100 - Math.abs(rock.y - 50));
      expect(Math.hypot(dx, dy)).toBeGreaterThan(30);
      expect(rock.size).toBe(3);
      expect(rock.verts).toHaveLength(9);
    }
  });
});
