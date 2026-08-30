import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  PasswordStrength,
  calculatePasswordStrength,
} from "../components/PasswordStrength";

describe("PasswordStrength", () => {
  it("calculates strength levels correctly", () => {
    // Weak password
    const weak = calculatePasswordStrength("abc");
    expect(weak.level).toBe("WEAK");
    expect(weak.score).toBe(1);

    // Fair password (>=8 chars + lowercase + number = 3 reqs)
    const fair = calculatePasswordStrength("password12");
    expect(fair.level).toBe("FAIR");
    expect(fair.score).toBe(2);

    // Good password (>=8 chars + lowercase + uppercase + number = 4 reqs)
    const good = calculatePasswordStrength("Password12");
    expect(good.level).toBe("GOOD");
    expect(good.score).toBe(3);

    // Strong password (all 5 requirements)
    const strong = calculatePasswordStrength("P@ssw0rd123!");
    expect(strong.level).toBe("STRONG");
    expect(strong.score).toBe(4);
  });

  it("renders strength label and requirement elements", () => {
    render(<PasswordStrength password="P@ssw0rd123!" showRequirements />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("At least one uppercase letter (A-Z)")).toBeInTheDocument();
  });

  it("returns null when empty password provided", () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });
});
